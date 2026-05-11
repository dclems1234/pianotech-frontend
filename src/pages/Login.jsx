import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // <-- use your shared axios instance
import "./Login.css";

function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        try {
            const res = await api.post("/auth/login", form);

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));

            navigate("/home");
        } catch (err) {
            setError("Invalid username or password");
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <img
                    src="/assets/pianotechpro-logo.png"
                    alt="PianoTech Pro"
                    className="login-logo"
                />

                <h2 className="login-title">PianoTech Pro Sign In</h2>

                <form onSubmit={handleSubmit} className="login-form">
                    <input
                        type="text"
                        placeholder="Username"
                        value={form.username}
                        onChange={(e) =>
                            setForm({ ...form, username: e.target.value })
                        }
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                        }
                    />

                    {error && <div className="error-text">{error}</div>}

                    <button type="submit" className="primary-btn">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;

