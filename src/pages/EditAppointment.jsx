import { useEffect, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import api from "../api";
import "./Form.css";

function EditAppointment() {
    const { id } = useParams();
    const navigate = useNavigate();

    // ⭐ Get user from HomeLayout
    const { user } = useOutletContext();
    if (!user) return <div className="form-container">Loading...</div>;

    const [customers, setCustomers] = useState([]);
    const [services, setServices] = useState([]);

    const [form, setForm] = useState({
        customerId: "",
        serviceId: "",
        date: "",
        time: "",
        durationMinutes: "",
        cost: "",
        notes: ""
    });

    const [loading, setLoading] = useState(true);

    // ---------------------------------------------------------
    // Load appointment + customers + services
    // ---------------------------------------------------------
    useEffect(() => {
        async function loadData() {
            try {
                const [apptRes, custRes, servRes] = await Promise.all([
                    api.get(`/appointments/${id}`),
                    api.get("/customers"),
                    api.get("/services")
                ]);

                const appt = apptRes.data;

                // ⭐ Stored as LOCAL TIME: "YYYY-MM-DD HH:mm:ss"
                // Convert to JS Date by replacing space with T
                const localDate = new Date(appt.startTime.replace(" ", "T"));

                setCustomers(custRes.data);
                setServices(servRes.data);

                setForm({
                    customerId: appt.customerId,
                    serviceId: appt.serviceId || "",
                    date: localDate.toISOString().split("T")[0],
                    time: localDate.toTimeString().slice(0, 5),
                    durationMinutes: appt.durationMinutes,
                    cost: appt.baseCost?.toFixed(2) || "",
                    notes: appt.notes || ""
                });

                setLoading(false);
            } catch (err) {
                console.error("Error loading edit data:", err);
            }
        }

        loadData();
    }, [id]);

    // ---------------------------------------------------------
    // Handle service change
    // ---------------------------------------------------------
    function handleServiceChange(serviceId) {
        const svc = services.find(s => s.id === Number(serviceId));

        setForm(prev => ({
            ...prev,
            serviceId,
            durationMinutes: svc ? svc.durationMinutes : prev.durationMinutes,
            cost: svc ? svc.cost.toFixed(2) : prev.cost
        }));
    }
    // ---------------------------------------------------------
    // Save changes (Correct Local‑Time Pipeline)
    // ---------------------------------------------------------
    async function handleSubmit(e) {
        e.preventDefault();

        // ⭐ Build a pure local ISO timestamp (NO UTC conversion)
        const startTime = `${form.date}T${form.time}:00`;

        const payload = {
            id: Number(id),
            customerId: Number(form.customerId),
            serviceId: form.serviceId === "" ? null : Number(form.serviceId),
            startTime,
            durationMinutes: Number(form.durationMinutes),
            baseCost: Number(form.cost),
            notes: form.notes
        };

        try {
            await api.put(`/appointments/${id}`, payload);
            navigate(`/home/appointments/${id}`);
        } catch (err) {
            console.error("Update error:", err);
            alert("Error updating appointment.");
        }
    }


    if (loading) return <div className="form-container">Loading...</div>;

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------
    return (
        <div className="form-container">
            <h1>Edit Appointment</h1>

            <form onSubmit={handleSubmit} className="modern-form">

                {/* Customer */}
                <label>Customer</label>
                <select
                    value={form.customerId}
                    onChange={e => setForm({ ...form, customerId: e.target.value })}
                >
                    <option value="">Select Customer</option>
                    {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                </select>

                {/* Service */}
                <label>Service</label>
                <select
                    value={form.serviceId}
                    onChange={e => handleServiceChange(e.target.value)}
                >
                    <option value="">Select Service</option>
                    {services.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.name} — {s.durationMinutes} mins — ${s.cost}
                        </option>
                    ))}
                </select>

                {/* Date */}
                <label>Date</label>
                <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                />

                {/* Time */}
                <label>Time</label>
                <input
                    type="time"
                    value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                />

                {/* Duration */}
                <label>Duration (minutes)</label>
                <input
                    type="number"
                    value={form.durationMinutes}
                    readOnly
                />

                {/* Cost */}
                <label>Cost</label>
                <input
                    type="number"
                    step="0.01"
                    value={form.cost}
                    onChange={e => setForm({ ...form, cost: e.target.value })}
                />

                {/* Notes */}
                <label>Notes</label>
                <textarea
                    placeholder="Notes"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                />

                <button className="primary-btn">Save Changes</button>
            </form>
        </div>
    );
}

export default EditAppointment;
