import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";   // <-- correct path for src/pages/users

function AddUser() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        fullName: "",
        username: "",
        password: "",
        role: "Standard"
    });

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            await api.post("/users", form);   // <-- uses ngrok baseURL
            navigate("/users");
        } catch (err) {
            console.error(err);
            alert("Error creating user");
        }
    }

    return (
        <div className="form-container">
            <h1>Add User</h1>

            <form onSubmit={handleSubmit} className="modern-form">
                <input
                    type="text"
                    placeholder="Full Name"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                />

                <input
                    type="text"
                    placeholder="Username"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                />

                <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                >
                    <option value="Standard">Standard</option>
                    <option value="Admin">Admin</option>
                </select>

                <button className="primary-btn">Create User</button>
            </form>
        </div>
    );
}

export default AddUser;