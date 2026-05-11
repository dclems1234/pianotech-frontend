import { useEffect, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import api from "../api";
import "./Form.css";
import { formatDate, formatTime, formatDateTime, nowInUserTimezoneISO } from "../utils/time";

function AppointmentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    // ⭐ Get user from HomeLayout
    const { user } = useOutletContext();
    if (!user) return <div>Loading...</div>;

    // ⭐ Branding
    const companyName = user.companyName || "PianoTech Pro";
    const companyLogo = user.companyLogoUrl || "/assets/pianotechpro-logo.png";

    const [appt, setAppt] = useState(null);
    const [payments, setPayments] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
    const [templates, setTemplates] = useState([]);

    // ---------------------------------------------------------
    // Load appointment
    // ---------------------------------------------------------
    useEffect(() => {
        api.get(`/appointments/${id}`)
            .then(res => setAppt(res.data))
            .catch(err => console.error("Error loading appointment:", err));
    }, [id]);

    // ---------------------------------------------------------
    // Load payments
    // ---------------------------------------------------------
    useEffect(() => {
        api.get(`/appointment-payments/${id}/payments`)
            .then(res => setPayments(res.data))
            .catch(err => console.error("Error loading payments:", err));
    }, [id]);

    // ---------------------------------------------------------
    // Load templates when modal opens
    // ---------------------------------------------------------
    useEffect(() => {
        if (templatePickerOpen) {
            api.get("/forms/templates")
                .then(res => setTemplates(res.data))
                .catch(err => console.error("Error loading templates:", err));
        }
    }, [templatePickerOpen]);

    // ---------------------------------------------------------
    // Delete appointment
    // ---------------------------------------------------------
    async function handleDelete() {
        if (!window.confirm("Delete this appointment?")) return;

        try {
            await api.delete(`/appointments/${id}`);
            navigate("/home/schedule");
        } catch (err) {
            console.error("Delete error:", err);
            alert("Error deleting appointment.");
        }
    }

    // ---------------------------------------------------------
    // Add Payment
    // ---------------------------------------------------------
    function openAddPayment() {
        setEditingPayment({
            amount: 0,
            method: "",
            status: "Paid",
            notes: "",
            paidAt: nowInUserTimezoneISO(user.timeZone) // ⭐ Correct local timestamp
        });
        setShowPaymentModal(true);
    }

    // ---------------------------------------------------------
    // Edit Payment
    // ---------------------------------------------------------
    function openEditPayment(payment) {
        setEditingPayment({ ...payment });
        setShowPaymentModal(true);
    }

    // ---------------------------------------------------------
    // Print Receipt (with branding + correct time)
    // ---------------------------------------------------------
    function printReceipt(payment, appointment) {
        const win = window.open("", "_blank");

        win.document.write(`
            <div style="text-align:center; margin-bottom:20px;">
                <img 
                    src="${companyLogo}" 
                    style="width:160px; height:auto; object-fit:contain; margin-bottom:10px;"
                />
                <h2 style="margin:0;">${companyName}</h2>
            </div>

            <h1>Payment Receipt</h1>

            <p><strong>Customer:</strong> ${appointment.customer.fullName}</p>
            <p><strong>Service:</strong> ${appointment.service?.name || "None"}</p>
            <p><strong>Appointment Date:</strong> ${formatDateTime(appointment.startTime)}</p>

            <hr/>

            <p><strong>Amount:</strong> $${payment.amount.toFixed(2)}</p>
            <p><strong>Method:</strong> ${payment.method}</p>
            <p><strong>Status:</strong> ${payment.status}</p>
            <p><strong>Date Paid:</strong> ${payment.paidAt ? formatDateTime(payment.paidAt) : "Not provided"
            }</p>
            <p><strong>Notes:</strong> ${payment.notes || ""}</p>

            <hr/>
            <p>Thank you!</p>
        `);

        win.print();
        win.close();
    }

    // ---------------------------------------------------------
    // Delete Payment
    // ---------------------------------------------------------
    async function handleDeletePayment() {
        if (!editingPayment?.id) return;
        if (!window.confirm("Delete this payment?")) return;

        try {
            await api.delete(`/appointment-payments/${id}/payments/${editingPayment.id}`);
            const res = await api.get(`/appointment-payments/${id}/payments`);
            setPayments(res.data);
            setShowPaymentModal(false);
        } catch (err) {
            console.error("Error deleting payment:", err);
            alert("Error deleting payment.");
        }
    }

    // ---------------------------------------------------------
    // Save Payment
    // ---------------------------------------------------------
    async function handleSavePayment() {
        if (!editingPayment) return;

        try {
            if (editingPayment.id) {
                await api.put(
                    `/appointment-payments/${id}/payments/${editingPayment.id}`,
                    editingPayment
                );
            } else {
                await api.post(
                    `/appointment-payments/${id}/payments`,
                    editingPayment
                );
            }

            const res = await api.get(`/appointment-payments/${id}/payments`);
            setPayments(res.data);
            setShowPaymentModal(false);
        } catch (err) {
            console.error("Error saving payment:", err);
            alert("Error saving payment.");
        }
    }

    if (!appt) return <div>Loading...</div>;

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = appt.baseCost - totalPaid;

    function getPaymentColor(status) {
        switch (status) {
            case "Paid": return "#4CAF50";
            case "Partial": return "#FF9800";
            case "Unpaid": return "#F44336";
            default: return "#999";
        }
    }

    return (
        <div className="form-container">
            <h1>Appointment Details</h1>

            {/* Appointment Info */}
            <div className="details-box">
                <p><strong>Customer:</strong> {appt.customer.fullName}</p>
                <p><strong>Service:</strong> {appt.service?.name || "None"}</p>
                <p><strong>Service Duration:</strong> {appt.service?.durationMinutes || appt.durationMinutes} minutes</p>
                <p><strong>Base Cost:</strong> ${appt.baseCost}</p>
                <p><strong>Date:</strong> {formatDate(appt.startTime)}</p>
                <p><strong>Time:</strong> {formatTime(appt.startTime)}</p>
                <p><strong>Notes:</strong> {appt.notes || "None"}</p>
            </div>

            {/* Start Form */}
            <button
                className="btn-secondary"
                style={{
                    backgroundColor: "#d3d3d3",
                    borderColor: "#000",
                    width: "100%",
                    height: "45px",
                    marginBottom: "20px"
                }}
                onClick={() => setTemplatePickerOpen(true)}
            >
                Start Form
            </button>

            {/* Edit + Cancel */}
            <div style={{ display: "flex", gap: "10px", marginTop: "10px", width: "100%" }}>
                <button
                    className="primary-btn"
                    style={{ flex: 1 }}
                    onClick={() => navigate(`/home/edit-appointment/${id}`)}
                >
                    Edit
                </button>

                <button
                    className="danger-btn"
                    style={{ flex: 1 }}
                    onClick={handleDelete}
                >
                    Cancel Appointment
                </button>
            </div>

            {/* Payments Section */}
            <div className="details-card" style={{ marginTop: "20px", position: "relative" }}>
                {balance <= 0 && (
                    <div
                        style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            backgroundColor: "#4CAF50",
                            color: "white",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontWeight: "bold",
                            fontSize: "0.85rem",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                        }}
                    >
                        PAID IN FULL
                    </div>
                )}

                <h3>Payments</h3>

                {/* Summary */}
                <div
                    style={{
                        marginBottom: "15px",
                        padding: "10px",
                        background: "#f7f7f7",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0"
                    }}
                >
                    <div><strong>Base Cost:</strong> ${appt.baseCost.toFixed(2)}</div>
                    <div><strong>Total Paid:</strong> ${totalPaid.toFixed(2)}</div>
                    <div>
                        <strong>Balance:</strong>{" "}
                        <span style={{ color: balance <= 0 ? "#4CAF50" : "#d9534f" }}>
                            ${balance.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: "15px" }}>
                    <div
                        style={{
                            height: "10px",
                            background: "#e0e0e0",
                            borderRadius: "5px",
                            overflow: "hidden"
                        }}
                    >
                        <div
                            style={{
                                height: "100%",
                                width: `${Math.min((totalPaid / appt.baseCost) * 100, 100)}%`,
                                background: balance <= 0 ? "#4CAF50" : "#2196F3",
                                transition: "width 0.3s ease"
                            }}
                        />
                    </div>

                    <small style={{ color: "#555" }}>
                        {balance <= 0
                            ? "Paid in full"
                            : `${Math.round((totalPaid / appt.baseCost) * 100)}% paid`}
                    </small>
                </div>

                {/* Payment List */}
                {payments.length === 0 ? (
                    <p>No payments recorded.</p>
                ) : (
                    <ul className="payment-list" style={{ listStyle: "none", padding: 0 }}>
                        {payments.map(p => (
                            <li
                                key={p.id}
                                style={{
                                    padding: "12px",
                                    marginBottom: "10px",
                                    borderRadius: "8px",
                                    border: "1px solid #ddd",
                                    background: "#fff",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                    borderLeft: `5px solid ${getPaymentColor(p.status)}`
                                }}
                            >
                                <div style={{ marginBottom: "5px" }}>
                                    <strong>${p.amount.toFixed(2)}</strong> — {p.method}
                                </div>

                                <div style={{ fontSize: "0.85rem", color: "#666" }}>
                                    {p.paidAt ? formatDateTime(p.paidAt) : "Not dated"}
                                </div>

                                {p.notes && (
                                    <div style={{ fontSize: "0.85rem", color: "#444", marginTop: "5px" }}>
                                        {p.notes}
                                    </div>
                                )}

                                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                    <button
                                        className="secondary-btn"
                                        onClick={() => openEditPayment(p)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="secondary-btn"
                                        onClick={() => printReceipt(p, appt)}
                                    >
                                        Print Receipt
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <button className="primary-btn" onClick={openAddPayment}>
                    Add Payment
                </button>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="modal-backdrop">
                    <div className="modal" style={{ padding: "20px", borderRadius: "10px" }}>
                        <h2 style={{ marginBottom: "15px" }}>
                            {editingPayment?.id ? "Edit Payment" : "Add Payment"}
                        </h2>

                        <div className="form-group">
                            <label>Amount</label>
                            <input
                                type="number"
                                className="form-input"
                                style={{ marginBottom: "12px" }}
                                value={editingPayment.amount}
                                onChange={e =>
                                    setEditingPayment(prev => ({
                                        ...prev,
                                        amount: parseFloat(e.target.value) || 0
                                    }))
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label>Method</label>
                            <select
                                className="form-input"
                                style={{ marginBottom: "12px" }}
                                value={editingPayment.method}
                                onChange={e =>
                                    setEditingPayment(prev => ({ ...prev, method: e.target.value }))
                                }
                            >
                                <option value="">Select...</option>
                                <option>Cash</option>
                                <option>Card</option>
                                <option>Check</option>
                                <option>Venmo</option>
                                <option>PayPal</option>
                                <option>Zelle</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select
                                className="form-input"
                                style={{ marginBottom: "12px" }}
                                value={editingPayment.status}
                                onChange={e =>
                                    setEditingPayment(prev => ({ ...prev, status: e.target.value }))
                                }
                            >
                                <option>Paid</option>
                                <option>Partial</option>
                                <option>Unpaid</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Notes</label>
                            <textarea
                                className="form-input"
                                style={{ marginBottom: "20px", minHeight: "70px" }}
                                value={editingPayment.notes}
                                onChange={e =>
                                    setEditingPayment(prev => ({ ...prev, notes: e.target.value }))
                                }
                            />
                        </div>

                        <div
                            className="modal-actions"
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >
                            <button onClick={() => setShowPaymentModal(false)}>
                                Cancel
                            </button>

                            {editingPayment?.id && (
                                <button
                                    className="danger-btn"
                                    onClick={handleDeletePayment}
                                    style={{ marginRight: "auto", marginLeft: "15px" }}
                                >
                                    Delete
                                </button>
                            )}

                            <button className="primary-btn" onClick={handleSavePayment}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Picker Modal */}
            {templatePickerOpen && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h2>Select a Form Template</h2>

                        {templates.length === 0 && <p>No templates available.</p>}

                        {templates.map(t => (
                            <button
                                key={t.id}
                                className="btn-secondary"
                                style={{ width: "100%", marginBottom: "10px" }}
                                onClick={() => {
                                    navigate(
                                        `/home/customers/${appt.customerId}/forms/fill/${t.id}?appointment=${appt.id}`
                                    );
                                }}
                            >
                                {t.name}
                            </button>
                        ))}

                        <div className="modal-actions">
                            <button onClick={() => setTemplatePickerOpen(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AppointmentDetails;
