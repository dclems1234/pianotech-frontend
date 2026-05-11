import { useEffect, useState, useMemo } from "react";
import {
    useParams,
    useNavigate,
    useSearchParams,
    useOutletContext
} from "react-router-dom";
import api from "../api";
import "../Form.css";
import { formatDate, formatTime, formatDateTime } from "../utils/time";

export default function CustomerDetails() {
    // ---------------------------------------------------------
    // HOOKS — MUST ALWAYS BE AT TOP, NEVER CONDITIONAL
    // ---------------------------------------------------------
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useOutletContext();

    // Customer + appointments
    const [customer, setCustomer] = useState(null);
    const [appointments, setAppointments] = useState([]);

    // Templates + form responses
    const [templates, setTemplates] = useState([]);
    const [formResponses, setFormResponses] = useState([]);
    const [formsLoading, setFormsLoading] = useState(true);

    // Tabs
    const initialTab = searchParams.get("tab") || "details";
    const [activeTab, setActiveTab] = useState(initialTab);

    // Forms filters
    const [formSearch, setFormSearch] = useState("");
    const [formStatusFilter, setFormStatusFilter] = useState("All");
    const [formTemplateFilter, setFormTemplateFilter] = useState("All");

    // Past appointments toggle
    const [showPast, setShowPast] = useState(false);

    // ---------------------------------------------------------
    // LOAD CUSTOMER
    // ---------------------------------------------------------
    useEffect(() => {
        api.get(`/customers/${id}`)
            .then(res => setCustomer(res.data))
            .catch(err => console.error("Error loading customer:", err));
    }, [id]);

    // ---------------------------------------------------------
    // LOAD APPOINTMENTS
    // ---------------------------------------------------------
    useEffect(() => {
        api.get(`/appointments/customer/${id}`)
            .then(res => setAppointments(res.data))
            .catch(err => console.error("Error loading appointments:", err));
    }, [id]);

    // ---------------------------------------------------------
    // LOAD TEMPLATES
    // ---------------------------------------------------------
    useEffect(() => {
        api.get("/forms/templates")
            .then(res => setTemplates(res.data))
            .catch(err => console.error("Error loading templates:", err));
    }, []);

    // ---------------------------------------------------------
    // LOAD FORM RESPONSES
    // ---------------------------------------------------------
    useEffect(() => {
        async function loadForms() {
            try {
                const res = await api.get(`/forms/responses/customer/${id}`);
                setFormResponses(res.data || []);
            } catch (err) {
                console.error("Error loading form responses:", err);
            }
            setFormsLoading(false);
        }
        loadForms();
    }, [id]);

    // ---------------------------------------------------------
    // FILTERED FORMS — SAFE TO USE useMemo
    // ---------------------------------------------------------
    const filteredForms = useMemo(() => {
        return formResponses
            .map(r => ({
                ...r,
                templateName: r.template?.name || "Untitled Template"
            }))
            .filter(r => {
                if (formStatusFilter !== "All" && r.status !== formStatusFilter) return false;
                if (formTemplateFilter !== "All" && String(r.template?.id) !== formTemplateFilter) return false;
                if (formSearch.trim()) {
                    const q = formSearch.toLowerCase();
                    if (!r.templateName.toLowerCase().includes(q)) return false;
                }
                return true;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [formResponses, formStatusFilter, formTemplateFilter, formSearch]);

    // ---------------------------------------------------------
    // HELPERS
    // ---------------------------------------------------------
    const now = new Date();
    const upcoming = appointments.filter(a => new Date(a.startTime) >= now);
    const past = appointments.filter(a => new Date(a.startTime) < now);

    function getPaymentColor(status) {
        switch (status) {
            case "Paid": return "#4CAF50";
            case "Partial": return "#FF9800";
            case "Unpaid": return "#F44336";
            default: return "#999";
        }
    }

    function handleViewForm(id) {
        navigate(`/home/forms/responses/${id}`);
    }

    function handleEditForm(r) {
        navigate(`/home/customers/${r.customerId}/forms/fill/${r.template.id}?edit=${r.id}`);
    }

    async function handleDownloadFormPdf(id) {
        try {
            const res = await api.get(`/forms/responses/${id}/pdf`, {
                responseType: "blob"
            });

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `FormResponse_${id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("PDF download failed:", err);
        }
    }

    // ---------------------------------------------------------
    // RENDER APPOINTMENT CARD
    // ---------------------------------------------------------
    function renderAppointmentCard(a, faded = false) {
        const totalPaid = a.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const balance = (a.baseCost || 0) - totalPaid;

        return (
            <div
                key={a.id}
                className="details-card"
                style={{
                    marginBottom: "15px",
                    opacity: faded ? 0.7 : 1,
                    position: "relative"
                }}
            >
                {balance <= 0 && (
                    <div
                        style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            backgroundColor: "#4CAF50",
                            color: "white",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontWeight: "bold",
                            fontSize: "0.8rem"
                        }}
                    >
                        PAID IN FULL
                    </div>
                )}

                <div><strong>Date:</strong> {formatDate(a.startTime)}</div>
                <div><strong>Time:</strong> {formatTime(a.startTime)}</div>
                <div><strong>Duration:</strong> {a.durationMinutes} minutes</div>

                <div
                    style={{
                        marginTop: "10px",
                        padding: "10px",
                        background: "#f7f7f7",
                        borderRadius: "8px"
                    }}
                >
                    <div><strong>Base Cost:</strong> ${a.baseCost?.toFixed(2) || "0.00"}</div>
                    <div><strong>Total Paid:</strong> ${totalPaid.toFixed(2)}</div>
                    <div>
                        <strong>Balance:</strong>{" "}
                        <span style={{ color: balance <= 0 ? "#4CAF50" : "#d9534f" }}>
                            ${balance.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div style={{ marginTop: "10px" }}>
                    <div
                        style={{
                            height: "8px",
                            background: "#e0e0e0",
                            borderRadius: "5px",
                            overflow: "hidden"
                        }}
                    >
                        <div
                            style={{
                                height: "100%",
                                width: `${Math.min((totalPaid / a.baseCost) * 100, 100)}%`,
                                background: balance <= 0 ? "#4CAF50" : "#2196F3",
                                transition: "width 0.3s ease"
                            }}
                        />
                    </div>
                    <small style={{ color: "#555" }}>
                        {balance <= 0
                            ? "Paid in full"
                            : `${Math.round((totalPaid / a.baseCost) * 100)}% paid`}
                    </small>
                </div>

                {a.payments?.length > 0 && (
                    <ul style={{ listStyle: "none", padding: 0, marginTop: "10px" }}>
                        {a.payments.map(p => (
                            <li
                                key={p.id}
                                style={{
                                    padding: "10px",
                                    marginBottom: "8px",
                                    borderRadius: "8px",
                                    border: "1px solid #ddd",
                                    background: "#fff",
                                    borderLeft: `5px solid ${getPaymentColor(p.status)}`
                                }}
                            >
                                <div><strong>${p.amount.toFixed(2)}</strong> — {p.method}</div>
                                <div style={{ fontSize: "0.85rem", color: "#666" }}>
                                    {p.paidAt ? formatDateTime(p.paidAt) : "Not dated"}
                                </div>
                                {p.notes && (
                                    <div style={{ fontSize: "0.85rem", marginTop: "5px" }}>
                                        {p.notes}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                <button
                    className="primary-btn"
                    style={{ marginTop: "10px" }}
                    onClick={() => navigate(`/home/appointments/${a.id}`)}
                >
                    View Appointment
                </button>
            </div>
        );
    }

    // ---------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------
    if (!customer) return <div className="page-container">Loading...</div>;

    return (
        <div className="page-container" style={{ display: "flex", gap: "30px" }}>
            {/* LEFT SIDE */}
            <div style={{ flex: 2 }}>
                <div className="tab-bar">
                    <button
                        className={activeTab === "details" ? "tab-item active" : "tab-item"}
                        onClick={() => setActiveTab("details")}
                    >
                        Details
                    </button>
                    <button
                        className={activeTab === "forms" ? "tab-item active" : "tab-item"}
                        onClick={() => setActiveTab("forms")}
                    >
                        Forms
                    </button>
                </div>

                {/* DETAILS TAB */}
                {activeTab === "details" && (
                    <>
                        <h1>{customer.fullName}</h1>

                        <div
                            className="details-card"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "10px 30px"
                            }}
                        >
                            <div><strong>Phone:</strong> {customer.phone}</div>
                            <div><strong>Email:</strong> {customer.email || "None"}</div>
                            <div><strong>Address 1:</strong> {customer.address1}</div>
                            <div><strong>Address 2:</strong> {customer.address2}</div>
                            <div><strong>City:</strong> {customer.city}</div>
                            <div><strong>State:</strong> {customer.state}</div>
                            <div><strong>Postal Code:</strong> {customer.postalCode}</div>
                            <div><strong>Piano:</strong> {customer.piano}</div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <strong>Notes:</strong> {customer.notes}
                            </div>
                        </div>

                        <div className="details-buttons">
                            <button
                                className="primary-btn"
                                onClick={() => navigate(`/home/customers/edit/${id}`)}
                            >
                                Edit Customer
                            </button>

                            <button
                                className="delete-btn"
                                onClick={async () => {
                                    if (!window.confirm("Delete this customer?")) return;
                                    await api.delete(`/customers/${id}`);
                                    navigate("/home/customers");
                                }}
                            >
                                Delete Customer
                            </button>
                        </div>
                    </>
                )}

                {/* FORMS TAB */}
                {activeTab === "forms" && (
                    <>
                        {/* Start New Form */}
                        <div
                            className="details-card"
                            style={{ padding: "15px 20px", marginBottom: "20px" }}
                        >
                            <h2 style={{ marginTop: 0 }}>Start New Form</h2>
                            <select
                                className="form-input"
                                style={{ width: "100%", padding: "10px" }}
                                onChange={e => {
                                    const templateId = e.target.value;
                                    if (!templateId) return;
                                    navigate(`/home/customers/${id}/forms/fill/${templateId}`);
                                }}
                            >
                                <option value="">Select a template...</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filters + List */}
                        <div className="details-card" style={{ padding: "20px" }}>
                            <h2 style={{ marginTop: 0 }}>Form History</h2>

                            {/* Filters */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "2fr 1fr 1fr",
                                    gap: "10px",
                                    marginBottom: "15px"
                                }}
                            >
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search by template name..."
                                    value={formSearch}
                                    onChange={e => setFormSearch(e.target.value)}
                                />

                                <select
                                    className="form-input"
                                    value={formStatusFilter}
                                    onChange={e => setFormStatusFilter(e.target.value)}
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Draft">Draft</option>
                                    <option value="Finalized">Finalized</option>
                                    <option value="Canceled">Canceled</option>
                                </select>

                                <select
                                    className="form-input"
                                    value={formTemplateFilter}
                                    onChange={e => setFormTemplateFilter(e.target.value)}
                                >
                                    <option value="All">All Templates</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={String(t.id)}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Forms List */}
                            {formsLoading ? (
                                <div>Loading forms...</div>
                            ) : filteredForms.length === 0 ? (
                                <div>No forms found for this customer.</div>
                            ) : (
                                filteredForms.map(r => (
                                    <div
                                        key={r.id}
                                        className="details-card"
                                        style={{
                                            marginBottom: "10px",
                                            padding: "12px 15px",
                                            border: "1px solid #e0e0e0",
                                            borderRadius: "8px",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center"
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: "bold" }}>
                                                {r.templateName}
                                            </div>
                                            <div style={{ fontSize: "0.9rem", color: "#666" }}>
                                                Created: {formatDateTime(r.createdAt)}
                                            </div>
                                            <div style={{ marginTop: "4px" }}>
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        padding: "2px 8px",
                                                        borderRadius: "999px",
                                                        fontSize: "0.8rem",
                                                        backgroundColor:
                                                            r.status === "Finalized"
                                                                ? "#e6f4ea"
                                                                : r.status === "Draft"
                                                                    ? "#fff8e1"
                                                                    : "#fbe9e7",
                                                        color:
                                                            r.status === "Finalized"
                                                                ? "#1b5e20"
                                                                : r.status === "Draft"
                                                                    ? "#ff8f00"
                                                                    : "#c62828"
                                                    }}
                                                >
                                                    {r.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                className="secondary-btn"
                                                onClick={() => handleViewForm(r.id)}
                                            >
                                                View
                                            </button>

                                            {r.status === "Draft" && (
                                                <button
                                                    className="secondary-btn"
                                                    onClick={() => handleEditForm(r)}
                                                >
                                                    Edit
                                                </button>
                                            )}

                                            <button
                                                className="secondary-btn"
                                                onClick={() => handleDownloadFormPdf(r.id)}
                                            >
                                                PDF
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* RIGHT SIDE — APPOINTMENTS + QUICK ACTIONS */}
            <div style={{ flex: 1 }}>
                {/* Quick Actions */}
                <div
                    className="details-card"
                    style={{ marginBottom: "20px", padding: "15px 20px" }}
                >
                    <h2 style={{ marginTop: 0 }}>Quick Actions</h2>
                    <button
                        className="primary-btn"
                        style={{ width: "100%", marginBottom: "10px" }}
                        onClick={() => navigate(`/home/add-appointment?customerId=${id}`)}
                    >
                        Schedule Appointment
                    </button>
                    <button
                        className="secondary-btn"
                        style={{ width: "100%", marginBottom: "10px" }}
                        onClick={() => setActiveTab("forms")}
                    >
                        View Forms
                    </button>
                    <button
                        className="secondary-btn"
                        style={{ width: "100%" }}
                        onClick={() => navigate("/home/customers")}
                    >
                        Back to Customers
                    </button>
                </div>

                <h2>Upcoming Appointments</h2>
                {upcoming.length === 0 && <div>No upcoming appointments.</div>}
                {upcoming.map(a => renderAppointmentCard(a, false))}

                <h2 style={{ marginTop: "30px" }}>Past Appointments</h2>
                <button
                    className="secondary-btn"
                    onClick={() => setShowPast(!showPast)}
                    style={{ marginBottom: "10px" }}
                >
                    {showPast ? "Hide Past Appointments" : "Show Past Appointments"}
                </button>
                {showPast && past.map(a => renderAppointmentCard(a, true))}
            </div>
        </div>
    );
}
