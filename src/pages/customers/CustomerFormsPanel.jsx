import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

export default function CustomerFormsPanel({ customerId }) {
    const navigate = useNavigate();

    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showReasonModal, setShowReasonModal] = useState(false);
    const [reason, setReason] = useState("");
    const [pendingAction, setPendingAction] = useState(null); // { type, form }

    useEffect(() => {
        loadForms();
    }, [customerId]);

    const loadForms = async () => {
        try {
            const res = await api.get(`/forms/responses/customer/${customerId}`);
            setForms(res.data);
        } catch (err) {
            console.error("Error loading forms:", err);
        }
        setLoading(false);
    };

    const openReasonModal = (type, form) => {
        setPendingAction({ type, form });
        setReason("");
        setShowReasonModal(true);
    };

    const executePendingAction = async () => {
        if (!pendingAction) return;

        const { type, form } = pendingAction;

        try {
            if (type === "delete") {
                await api.delete(`/forms/responses/${form.id}`, {
                    data: { reason }
                });
            }

            if (type === "edit") {
                navigate(
                    `/home/customers/${customerId}/forms/fill/${form.templateId}?edit=${form.id}&reason=${encodeURIComponent(reason)}`
                );
            }

            setShowReasonModal(false);
            setPendingAction(null);
            loadForms();
        } catch (err) {
            console.error("Action failed:", err);
        }
    };

    if (loading) return <div>Loading forms...</div>;

    const visibleForms = forms.filter(f => f.status !== "Canceled");

    return (
        <div>
            <h2>Forms</h2>

            {visibleForms.length === 0 && (
                <div>No forms yet for this customer.</div>
            )}

            {visibleForms.map(form => (
                <div
                    key={form.id}
                    className="details-card"
                    style={{ marginBottom: "15px", padding: "15px" }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong>{form.template?.name}</strong>

                        {/* ⭐ STATUS BADGE */}
                        <span
                            style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                color: "white",
                                backgroundColor:
                                    form.status === "Draft"
                                        ? "#007bff"
                                        : form.status === "Finalized"
                                            ? "#28a745"
                                            : "#6c757d"
                            }}
                        >
                            {form.status}
                        </span>
                    </div>

                    <div style={{ marginTop: "8px", fontSize: "14px" }}>
                        <strong>Created:</strong>{" "}
                        {new Date(form.createdAt).toLocaleString()}
                    </div>

                    {/* ⭐ ACTION BUTTONS */}
                    <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
                        {/* DRAFT → Continue Editing */}
                        {form.status === "Draft" && (
                            <button
                                className="primary-btn"
                                onClick={() =>
                                    navigate(
                                        `/home/customers/${customerId}/forms/fill/${form.templateId}?edit=${form.id}`
                                    )
                                }
                            >
                                Continue Draft
                            </button>
                        )}

                        {/* FINALIZED → View */}
                        {form.status === "Finalized" && (
                            <button
                                className="secondary-btn"
                                style={{
                                    width: "60%"
                                }}
                                onClick={() =>
                                    navigate(`/home/forms/responses/${form.id}`)
                                }
                            >
                                View
                            </button>
                        )}

                        {/* FINALIZED → Edit (requires reason) */}
                        {form.status === "Finalized" && (
                            <button
                                className="secondary-btn"
                                style={{
                                    backgroundColor: "#0060e6",
                                    borderColor: "#0060e6",
                                    width: "20%"
                                }}
                                onClick={() => openReasonModal("edit", form)}
                            >
                                Edit
                            </button>
                        )}

                        {/* DELETE (Draft = immediate, Finalized = reason) */}
                        <button
                            className="secondary-btn"
                            style={{
                                backgroundColor: "#e61300",
                                borderColor: "#e61300",
                                width: "20%"
                            }}
                            onClick={() => {
                                if (form.status === "Draft") {
                                    // delete immediately
                                    api
                                        .delete(`/forms/responses/${form.id}`, {
                                            data: { reason: "Draft deleted" }
                                        })
                                        .then(loadForms);
                                } else {
                                    openReasonModal("delete", form);
                                }
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}

            {/* ⭐ REASON MODAL */}
            {showReasonModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h2>Reason Required</h2>

                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter reason..."
                        />

                        <div className="modal-actions">
                            <button onClick={() => setShowReasonModal(false)}>
                                Cancel
                            </button>

                            <button
                                className="primary-btn"
                                disabled={!reason.trim()}
                                onClick={executePendingAction}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


