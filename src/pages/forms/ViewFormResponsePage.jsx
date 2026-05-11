import { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import api from "../../api";
import { formatDateTime } from "../../utils/time";

export default function ViewFormResponsePage() {
    const { responseId } = useParams();
    const navigate = useNavigate();

    const { user } = useOutletContext();
    const timeZone = user?.timeZone || "America/New_York";
    const companyName = user?.companyName || "PianoTech Pro";
    const companyLogo = user?.companyLogoUrl || "/assets/pianotechpro-logo.png";

    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);

    const [reason, setReason] = useState("");
    const [previewImage, setPreviewImage] = useState(null);

    // ---------------------------------------------------------
    // Load response
    // ---------------------------------------------------------
    useEffect(() => {
        loadResponse();
    }, [responseId]);

    async function loadResponse() {
        try {
            const res = await api.get(`/forms/responses/${responseId}`);
            setResponse(res.data);
        } catch (err) {
            console.error("Error loading form response:", err);
        }
        setLoading(false);
    }

    // ---------------------------------------------------------
    // DELETE
    // ---------------------------------------------------------
    const handleDelete = async () => {
        try {
            await api.delete(`/forms/responses/${responseId}`, {
                data: { reason }
            });
            navigate(`/home/customers/${response.customerId}`);
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    // ---------------------------------------------------------
    // FINALIZE
    // ---------------------------------------------------------
    const handleFinalize = async () => {
        try {
            await api.put(`/forms/responses/${responseId}`, {
                status: "Finalized",
                reason: reason || null,
                answers: response.answers.map(a => ({
                    fieldId: a.field.id,
                    value: a.value
                }))
            });

            navigate(0);
        } catch (err) {
            console.error("Finalize failed:", err);
        }
    };

    // ---------------------------------------------------------
    // EDIT
    // ---------------------------------------------------------
    const handleEdit = () => {
        navigate(
            `/home/customers/${response.customerId}/forms/fill/${response.template.id}?edit=${response.id}&reason=${encodeURIComponent(reason)}`
        );
    };

    // ---------------------------------------------------------
    // PDF DOWNLOAD
    // ---------------------------------------------------------
    const downloadPdf = async () => {
        try {
            const res = await api.get(`/forms/responses/${responseId}/pdf`, {
                responseType: "blob"
            });

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `FormResponse_${responseId}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("PDF download failed:", err);
        }
    };

    // ---------------------------------------------------------
    // UI STATES
    // ---------------------------------------------------------
    if (loading) return <div className="page-container">Loading...</div>;
    if (!response) return <div className="page-container">Form response not found.</div>;

    const isDraft = response.status === "Draft";
    const isFinalized = response.status === "Finalized";
    const isCanceled = response.status === "Canceled";

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------
    return (
        <div className="page-container">

            {/* ⭐ BRANDING HEADER */}
            <div style={{ textAlign: "center", marginBottom: "25px" }}>
                <img
                    src={companyLogo}
                    alt={companyName}
                    style={{
                        width: "160px",
                        height: "auto",
                        objectFit: "contain",
                        marginBottom: "10px"
                    }}
                />
                <h2 style={{ margin: 0 }}>{companyName}</h2>
            </div>

            {/* BACK BUTTON */}
            <button
                className="secondary-btn"
                onClick={() => navigate(-1)}
                style={{ marginBottom: "20px" }}
            >
                ← Back
            </button>

            <h1>{response.template?.name}</h1>

            <p><strong>Status:</strong> {response.status}</p>
            <p><strong>Completed:</strong> {formatDateTime(response.createdAt, timeZone)}</p>

            {/* PDF BUTTON */}
            <button
                className="secondary-btn"
                onClick={downloadPdf}
                style={{
                    marginBottom: "25px",
                    width: "30%",
                    height: "30px"
                }}
            >
                Export to PDF
            </button>

            {/* ⭐ FORM ANSWERS */}
            <div className="details-card" style={{ padding: "20px" }}>
                {response.answers.map(answer => {
                    const type = answer.field?.type;
                    let displayValue = answer.value;

                    if (type === "MultiChoice") {
                        try {
                            const arr = JSON.parse(answer.value || "[]");
                            displayValue = arr.length > 0 ? arr.join(", ") : <em>No answer provided</em>;
                        } catch {
                            displayValue = answer.value;
                        }
                    }

                    return (
                        <div
                            key={answer.id}
                            style={{
                                marginBottom: "20px",
                                borderBottom: "1px solid #ddd",
                                paddingBottom: "10px"
                            }}
                        >
                            <strong>{answer.field?.label}</strong>

                            <div style={{ marginTop: "5px" }}>
                                {/* SIGNATURE */}
                                {type === "Signature" ? (
                                    answer.value ? (
                                        <img
                                            src={answer.value}
                                            alt="Signature"
                                            style={{
                                                width: "300px",
                                                height: "120px",
                                                border: "1px solid #ccc",
                                                background: "white"
                                            }}
                                        />
                                    ) : (
                                        <em>No signature provided</em>
                                    )
                                ) : null}

                                {/* PHOTO */}
                                {type === "Photo" ? (
                                    answer.value ? (
                                        <img
                                            src={answer.value}
                                            alt="Uploaded"
                                            onClick={() => setPreviewImage(answer.value)}
                                            style={{
                                                width: "150px",
                                                height: "auto",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                border: "1px solid #ccc",
                                                marginTop: "5px"
                                            }}
                                        />
                                    ) : (
                                        <em>No photo provided</em>
                                    )
                                ) : null}

                                {/* TEXT / CHOICE / MULTI-CHOICE */}
                                {type !== "Signature" && type !== "Photo" && (
                                    displayValue || <em>No answer provided</em>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ⭐ ACTION BUTTONS */}
            {!isCanceled && (
                <div
                    style={{
                        display: "flex",
                        gap: "15px",
                        marginTop: "30px",
                        justifyContent: "flex-start"
                    }}
                >
                    {/* EDIT */}
                    <button
                        className="primary-btn"
                        style={{ flex: 1 }}
                        onClick={() => {
                            if (isFinalized) setShowEditModal(true);
                            else handleEdit();
                        }}
                    >
                        Edit
                    </button>

                    {/* DELETE */}
                    <button
                        className="primary-btn"
                        style={{
                            flex: 1,
                            backgroundColor: "#e61300",
                            borderColor: "#e61300"
                        }}
                        onClick={() => {
                            if (isFinalized) setShowDeleteModal(true);
                            else handleDelete();
                        }}
                    >
                        Delete
                    </button>
                </div>
            )}

            {/* ⭐ FULLSCREEN IMAGE PREVIEW */}
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

            {/* ⭐ DELETE MODAL */}
            {showDeleteModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h2>Reason for deleting?</h2>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter reason..."
                        />
                        <div className="modal-actions">
                            <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button
                                className="danger-btn"
                                disabled={!reason.trim()}
                                onClick={handleDelete}
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ⭐ EDIT MODAL */}
            {showEditModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h2>Reason for editing?</h2>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter reason..."
                        />
                        <div className="modal-actions">
                            <button onClick={() => setShowEditModal(false)}>Cancel</button>
                            <button
                                className="primary-btn"
                                disabled={!reason.trim()}
                                onClick={handleEdit}
                            >
                                Continue to Edit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ⭐ FINALIZE MODAL */}
            {showFinalizeModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h2>Finalize this form?</h2>
                        <p>This will lock the form. You will need a reason to edit or delete it later.</p>
                        <div className="modal-actions">
                            <button onClick={() => setShowFinalizeModal(false)}>Cancel</button>
                            <button
                                className="primary-btn"
                                style={{ backgroundColor: "#28a745", borderColor: "#28a745" }}
                                onClick={handleFinalize}
                            >
                                Finalize Form
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
