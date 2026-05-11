import { useEffect, useState } from "react";
import { useNavigate, useLocation, useOutletContext } from "react-router-dom";
import api from "../api";
import "./Form.css";

function AddAppointment() {
    const navigate = useNavigate();
    const location = useLocation();

    // ⭐ Get user from HomeLayout
    const { user } = useOutletContext();
    if (!user) return <div className="form-container">Loading...</div>;

    const [customers, setCustomers] = useState([]);
    const [services, setServices] = useState([]);

    const [form, setForm] = useState({
        customerId: "",
        serviceId: null,
        date: "",
        time: "",
        durationMinutes: 60,
        cost: "",
        notes: ""
    });

    const [errors, setErrors] = useState({});

    // ---------------------------------------------------------
    // Prefill from query params
    // ---------------------------------------------------------
    useEffect(() => {
        const params = new URLSearchParams(location.search);

        setForm(prev => ({
            ...prev,
            date: params.get("date") || prev.date,
            time: params.get("time") || prev.time,
            customerId: params.get("customerId")
                ? Number(params.get("customerId"))
                : prev.customerId
        }));
    }, [location.search]);

    // ---------------------------------------------------------
    // Load customers + services
    // ---------------------------------------------------------
    useEffect(() => {
        api.get("/customers").then(res => setCustomers(res.data));
        api.get("/services").then(res => setServices(res.data));
    }, []);

    // ---------------------------------------------------------
    // Handle service selection
    // ---------------------------------------------------------
    function handleServiceChange(e) {
        const value = e.target.value;

        if (!value || value === "null") {
            setForm(prev => ({
                ...prev,
                serviceId: null,
                durationMinutes: prev.durationMinutes,
                cost: ""
            }));
            return;
        }

        const serviceId = Number(value);
        const selected = services.find(s => s.id === serviceId);

        setForm(prev => ({
            ...prev,
            serviceId,
            durationMinutes: selected?.durationMinutes ?? prev.durationMinutes,
            cost: selected?.cost?.toFixed(2) ?? ""
        }));
    }

    // ---------------------------------------------------------
    // Validation
    // ---------------------------------------------------------
    function validate() {
        const newErrors = {};

        if (!form.customerId) newErrors.customerId = "Select a customer";
        if (!form.serviceId) newErrors.serviceId = "Select a service";
        if (!form.date) newErrors.date = "Select a date";
        if (!form.time) newErrors.time = "Select a time";

        return newErrors;
    }

    // ---------------------------------------------------------
    // Submit (Correct Local‑Time Pipeline)
    // ---------------------------------------------------------
    async function handleSubmit(e) {
        e.preventDefault();

        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // ⭐ Build a pure local ISO timestamp (NO UTC conversion)
        const startTime = `${form.date}T${form.time}:00`;

        const payload = {
            customerId: Number(form.customerId),
            serviceId: form.serviceId ? Number(form.serviceId) : null,
            startTime,
            durationMinutes: Number(form.durationMinutes),
            baseCost: Number(form.cost),
            notes: form.notes ?? ""
        };

        try {
            await api.post("/appointments", payload);
            navigate("/home/schedule");
        } catch (err) {
            console.error("API error:", err.response?.data || err.message);
            alert("Error saving appointment. Check console.");
        }
    }


    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------
    return (
        <div className="form-container">
            <h1>Schedule Appointment</h1>

            <form onSubmit={handleSubmit} className="modern-form">

                {/* Customer */}
                <div className="form-group">
                    <label>Customer</label>
                    <select
                        name="customerId"
                        value={form.customerId}
                        onChange={(e) =>
                            setForm({ ...form, customerId: Number(e.target.value) })
                        }
                        className={errors.customerId ? "input-error" : ""}
                    >
                        <option value="">Select customer...</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.fullName}
                            </option>
                        ))}
                    </select>
                    {errors.customerId && <div className="error-text">{errors.customerId}</div>}
                </div>

                {/* Service */}
                <div className="form-group">
                    <label>Service</label>
                    <select
                        name="serviceId"
                        value={form.serviceId ?? "null"}
                        onChange={handleServiceChange}
                        className={errors.serviceId ? "input-error" : ""}
                    >
                        <option value="null">Select service...</option>
                        {services.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.name} — {s.durationMinutes} mins — ${s.cost}
                            </option>
                        ))}
                    </select>
                    {errors.serviceId && <div className="error-text">{errors.serviceId}</div>}
                </div>

                {/* Date */}
                <div className="form-group">
                    <label>Date</label>
                    <input
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                        className={errors.date ? "input-error" : ""}
                    />
                    {errors.date && <div className="error-text">{errors.date}</div>}
                </div>

                {/* Time */}
                <div className="form-group">
                    <label>Time</label>
                    <input
                        type="time"
                        name="time"
                        value={form.time}
                        onChange={handleChange}
                        className={errors.time ? "input-error" : ""}
                    />
                    {errors.time && <div className="error-text">{errors.time}</div>}
                </div>

                {/* Duration */}
                <div className="form-group">
                    <label>Duration (minutes)</label>
                    <input
                        type="number"
                        name="durationMinutes"
                        value={form.durationMinutes}
                        disabled
                    />
                </div>

                {/* Cost */}
                <div className="form-group">
                    <label>Cost</label>
                    <input
                        type="number"
                        step="0.01"
                        name="cost"
                        value={form.cost}
                        onChange={handleChange}
                    />
                </div>

                {/* Notes */}
                <div className="form-group">
                    <label>Notes</label>
                    <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        rows="3"
                    />
                </div>

                <button type="submit" className="primary-btn">Save Appointment</button>
            </form>
        </div>
    );
}

export default AddAppointment;
