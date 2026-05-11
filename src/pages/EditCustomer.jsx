import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";   // <-- use shared axios instance
import "./Form.css";

const GEOAPIFY_KEY = "e4520822df4c48e4bbeef9d0c68ca3d4";

function EditCustomer() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        email: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        postalCode: "",
        piano: "",
        notes: ""
    });

    const [suggestions, setSuggestions] = useState([]);
    const [errors, setErrors] = useState({});

    function formatPhone(value) {
        const digits = value.replace(/\D/g, "");
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }

    function validatePhone(phone) {
        const pattern = /^(\(?\d{3}\)?[- ]?)?\d{3}[- ]?\d{4}$/;
        return pattern.test(phone);
    }

    function validateEmail(email) {
        if (!email) return true;
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
    }

    // Load existing customer
    useEffect(() => {
        api.get(`/customers/${id}`)
            .then(res => setForm(res.data))
            .catch(err => console.error("Error loading customer:", err));
    }, [id]);

    function handleChange(e) {
        const { name, value } = e.target;

        if (name === "phone") {
            const formatted = formatPhone(value);
            setForm({ ...form, phone: formatted });
            return;
        }

        if (name === "address1" && value.length > 3) {
            fetch(
                `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
                    value
                )}&apiKey=${GEOAPIFY_KEY}`
            )
                .then((res) => res.json())
                .then((data) => {
                    setSuggestions(data.features || []);
                });
        } else if (name === "address1") {
            setSuggestions([]);
        }

        setForm({ ...form, [name]: value });
    }

    function selectSuggestion(s) {
        const props = s.properties;

        setForm({
            ...form,
            address1: props.address_line1 || "",
            address2: props.address_line2 || "",
            city: props.city || "",
            state: props.state || "",
            postalCode: props.postcode || ""
        });

        setSuggestions([]);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const newErrors = {};

        if (!validatePhone(form.phone)) {
            newErrors.phone = "Invalid phone number format";
        }

        if (!validateEmail(form.email)) {
            newErrors.email = "Invalid email format";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await api.put(`/customers/${id}`, form);
            navigate("/home/customers");
        } catch (err) {
            console.error("API error:", err.response ? err.response.data : err.message);
            alert("Error updating customer. Check console.");
        }
    }

    return (
        <div className="form-container">
            <h1>Edit Customer</h1>

            <form onSubmit={handleSubmit} className="modern-form">

                <div className="form-group">
                    <label>Full Name</label>
                    <input name="fullName" value={form.fullName} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Phone</label>
                    <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className={errors.phone ? "input-error" : ""}
                    />
                    {errors.phone && <div className="error-text">{errors.phone}</div>}
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className={errors.email ? "input-error" : ""}
                    />
                    {errors.email && <div className="error-text">{errors.email}</div>}
                </div>

                <div className="form-group" style={{ position: "relative" }}>
                    <label>Address Line 1</label>
                    <input
                        name="address1"
                        value={form.address1}
                        onChange={handleChange}
                        autoComplete="off"
                    />

                    {suggestions.length > 0 && (
                        <ul className="suggestions">
                            {suggestions.map((s) => (
                                <li
                                    key={s.properties.place_id}
                                    onClick={() => selectSuggestion(s)}
                                >
                                    {s.properties.formatted}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="form-group">
                    <label>Address Line 2</label>
                    <input name="address2" value={form.address2} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>City</label>
                    <input name="city" value={form.city} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>State</label>
                    <input name="state" value={form.state} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Postal Code</label>
                    <input
                        name="postalCode"
                        value={form.postalCode}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Piano</label>
                    <input name="piano" value={form.piano} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Notes</label>
                    <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        rows="4"
                    />
                </div>

                <button type="submit" className="primary-btn">Save Changes</button>
            </form>
        </div>
    );
}

export default EditCustomer;