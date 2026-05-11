import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams, useOutletContext } from "react-router-dom";
import api from "../../api";
import SignaturePad from "react-signature-canvas";
import { formatDateTime } from "../../utils/time";

export default function FillFormPage() {
    const { customerId, templateId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const { user } = useOutletContext();
    const timeZone = user?.timeZone || "America/New_York";

    const editId = searchParams.get("edit");
    const editReason = searchParams.get("reason") || null;
    const isEditMode = editId !== null;

    const [template, setTemplate] = useState(null);
    const [answers, setAnswers] = useState({});
    const [saving, setSaving] = useState(false);

    const signatureRefs = useRef({});
    const [previewImage, setPreviewImage] = useState(null);

    // ---------------------------------------------------------
    // Load template + existing answers
    // ---------------------------------------------------------
    useEffect(() => {
        loadTemplate();
    }, [templateId]);

    async function loadTemplate() {
        try {
            const res = await api.get(`/forms/templates/${templateId}`);
            setTemplate(res.data);

            if (isEditMode) {
                const existing = await api.get(`/forms/responses/${editId}`);
                const mapped = {};

                existing.data.answers.forEach(a => {
                    if (a.field.type === "MultiChoice") {
                        mapped[a.field.id] = JSON.parse(a.value || "[]");
                    } else {
                        mapped[a.field.id] = a.value;
                    }
                });

                setAnswers(mapped);
            }
        } catch (err) {
            console.error("Error loading template:", err);
        }
    }

    // ---------------------------------------------------------
    // Update answer
    // ---------------------------------------------------------
    const setAnswer = (fieldId, value) => {
        setAnswers(prev => ({ ...prev, [fieldId]: value }));
    };

    // ---------------------------------------------------------
    // Build payload
    // ---------------------------------------------------------
    const buildPayload = () => ({
        answers: Object.entries(answers).map(([fieldId, value]) => ({
            fieldId: Number(fieldId),
            value: Array.isArray(value)
                ? JSON.stringify(value)
                : value ?? ""
        }))
    });

    // ---------------------------------------------------------
    // Save Draft
    // ---------------------------------------------------------
    const handleSaveDraft = async () => {
        setSaving(true);
        const payload = buildPayload();

        try {
            if (isEditMode) {
                await api.put(`/forms/responses/${editId}`, {
                    status: "Draft",
                    reason: editReason ?? "",
                    answers: payload.answers
                });

                navigate(`/home/customers/${customerId}/forms/fill/${templateId}?edit=${editId}`);
            } else {
                const res = await api.post("/forms/responses", {
                    templateId: Number(templateId),
                    customerId: Number(customerId),
                    status: "Draft",
                    answers: payload.answers
                });

                const newId = res.data.id;
                navigate(`/home/customers/${customerId}/forms/fill/${templateId}?edit=${newId}`);
            }
        } catch (err) {
            console.error("Error saving draft:", err);
        }

        setSaving(false);
    };

    // ---------------------------------------------------------
    // Finalize
    // ---------------------------------------------------------
    const handleFinalize = async () => {
        if (!window.confirm("Finalize this form? You will need a reason to edit or delete it later.")) return;

        setSaving(true);
        const payload = buildPayload();

        try {
            if (isEditMode) {
                await api.put(`/forms/responses/${editId}`, {
                    status: "Finalized",
                    reason: editReason ?? "",
                    answers: payload.answers
                });

                navigate(`/home/forms/responses/${editId}`);
            } else {
                await api.post("/forms/responses", {
                    templateId: Number(templateId),
                    customerId: Number(customerId),
                    status: "Finalized",
                    answers: payload.answers
                });

                navigate(`/home/customers/${customerId}?tab=forms`);
            }
        } catch (err) {
            console.error("Error finalizing form:", err);
        }

        setSaving(false);
    };

    // ---------------------------------------------------------
    // Cancel
    // ---------------------------------------------------------
    const handleCancel = () => {
        if (!window.confirm("Cancel this form? It will be voided and not saved.")) return;
        navigate(`/home/customers/${customerId}?tab=forms`);
    };

    if (!template) return <div className="page-container">Loading form...</div>;

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------
    return (
        <div className="page-container" style={{ display: "flex", gap: "30px" }}>
            {/* LEFT SIDE — FORM CONTENT */}
            <div style={{ flex: 3 }}>
                <h1>
                    {template.name}
                    {isEditMode && (
                        <span style={{ color: "#888", marginLeft: "10px" }}>
                            (Editing)
                        </span>
                    )}
                </h1>

                <div className="details-card" style={{ padding: "20px" }}>
                    {template.fields
                        .sort((a, b) => a.order - b.order)
                        .map(field => (
                            <div key={field.id} style={{ marginBottom: "20px" }}>
                                {/* TITLE */}
                                {field.type === "Title" && (
                                    <h2 style={{ marginBottom: "10px" }}>{field.label}</h2>
                                )}

                                {/* TEXT */}
                                {field.type === "Text" && (
                                    <>
                                        <label><strong>{field.label}</strong></label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={answers[field.id] || ""}
                                            onChange={e => setAnswer(field.id, e.target.value)}
                                            style={{ width: "100%", padding: "8px" }}
                                        />
                                    </>
                                )}

                                {/* CHOICE */}
                                {field.type === "Choice" && (
                                    <>
                                        <label><strong>{field.label}</strong></label>
                                        <select
                                            className="form-input"
                                            value={answers[field.id] || ""}
                                            onChange={e => setAnswer(field.id, e.target.value)}
                                            style={{ width: "100%", padding: "8px" }}
                                        >
                                            <option value="">Select...</option>
                                            {JSON.parse(field.optionsJson || "[]").map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </>
                                )}

                                {/* MULTI-CHOICE */}
                                {field.type === "MultiChoice" && (
                                    <>
                                        <label><strong>{field.label}</strong></label>
                                        <select
                                            multiple
                                            className="form-input"
                                            value={answers[field.id] || []}
                                            onChange={e => {
                                                const selected = Array.from(
                                                    e.target.selectedOptions
                                                ).map(o => o.value);
                                                setAnswer(field.id, selected);
                                            }}
                                            style={{
                                                width: "100%",
                                                padding: "8px",
                                                height: "120px"
                                            }}
                                        >
                                            {JSON.parse(field.optionsJson || "[]").map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </>
                                )}

                                {/* PHOTO */}
                                {field.type === "Photo" && (
                                    <>
                                        <label><strong>{field.label}</strong></label>

                                        {/* Upload */}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async e => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setAnswer(field.id, reader.result); // ⭐ base64
                                                };
                                                reader.readAsDataURL(file);
                                            }}
                                        />

                                        {/* Preview */}
                                        {answers[field.id] && (
                                            <img
                                                src={answers[field.id]}
                                                alt="Uploaded"
                                                className="photo-thumb"
                                                onClick={() => setPreviewImage(answers[field.id])}
                                                style={{
                                                    marginTop: "10px",
                                                    width: "150px",
                                                    height: "auto",
                                                    borderRadius: "6px",
                                                    cursor: "pointer",
                                                    border: "1px solid #ccc"
                                                }}
                                            />
                                        )}
                                    </>
                                )}

                                {/* SIGNATURE */}
                                {field.type === "Signature" && (
                                    <div style={{ marginBottom: "20px" }}>
                                        <label><strong>{field.label}</strong></label>

                                        <div
                                            style={{
                                                border: "2px solid #444",
                                                borderRadius: "6px",
                                                padding: "10px",
                                                background: "white",
                                                width: "520px",
                                                marginTop: "5px"
                                            }}
                                        >
                                            <SignaturePad
                                                ref={ref => (signatureRefs.current[field.id] = ref)}
                                                canvasProps={{
                                                    width: 500,
                                                    height: 180,
                                                    style: {
                                                        border: "1px dashed #888",
                                                        background: "white"
                                                    }
                                                }}
                                                onEnd={() => {
                                                    const dataUrl =
                                                        signatureRefs.current[field.id].toDataURL("image/png");
                                                    setAnswer(field.id, dataUrl);
                                                }}
                                            />
                                        </div>

                                        <button
                                            className="btn-secondary"
                                            style={{ marginTop: "10px" }}
                                            onClick={() => {
                                                signatureRefs.current[field.id].clear();
                                                setAnswer(field.id, "");
                                            }}
                                        >
                                            Clear Signature
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            </div>

            {/* RIGHT SIDE — ACTION PANEL */}
            <div style={{ flex: 1 }}>
                <div
                    style={{
                        position: "sticky",
                        top: "20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "15px",
                        padding: "20px",
                        background: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                    }}
                >
                    <button
                        className="primary-btn"
                        style={{ width: "100%" }}
                        disabled={saving}
                        onClick={handleSaveDraft}
                    >
                        {saving ? "Saving..." : "Save Draft"}
                    </button>

                    <button
                        className="primary-btn"
                        style={{
                            width: "100%",
                            backgroundColor: "#28a745",
                            borderColor: "#28a745"
                        }}
                        disabled={saving}
                        onClick={handleFinalize}
                    >
                        Finalize
                    </button>

                    <button
                        className="primary-btn"
                        style={{
                            width: "100%",
                            backgroundColor: "#e61300",
                            borderColor: "#e61300"
                        }}
                        onClick={handleCancel}
                    >
                        Cancel Form
                    </button>
                </div>
            </div>

            {/* FULLSCREEN IMAGE PREVIEW */}
            {previewImage && (
                <div
                    onClick={() => setPreviewImage(null)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        background: "rgba(0,0,0,0.8)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 9999,
                        cursor: "zoom-out"
                    }}
                >
                    <img
                        src={previewImage}
                        alt="Preview"
                        style={{
                            maxWidth: "90%",
                            maxHeight: "90%",
                            borderRadius: "8px"
                        }}
                    />
                </div>
            )}
        </div>
    );
}
