import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import "./HomeLayout.css";

function HomeLayout() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load logged-in user
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        api.get("/users/me")
            .then(res => {
                setUser(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading user:", err);
                localStorage.removeItem("token");
                navigate("/login");
            });
    }, []);

    if (loading || !user) {
        return (
            <div className="home-layout">
                <header className="home-header">
                    <h2>Loading...</h2>
                </header>
            </div>
        );
    }

    // Branding logic
    const companyName = user.companyName || "PianoTech Pro";

    // ⭐ NEW: Load logo from SQL endpoint
    const apiBase = import.meta.env.VITE_API_URL;

    const companyLogo = user.hasLogo
        ? `${apiBase}/api/users/${user.id}/logo`
        : "/assets/pianotechpro-logo.png";

    return (
        <div className="home-layout">
            <header className="home-header">

                {/* LEFT SIDE — LOGO + COMPANY NAME */}
                <div className="header-left">
                    <div
                        className="home-logo-box"
                        onClick={() => navigate("/home")}
                        style={{ cursor: "pointer" }}
                    >
                        <img
                            src={companyLogo}
                            alt={companyName}
                            className="company-logo"
                        />
                    </div>

                    <div className="company-info">
                        <h2>{companyName}</h2>
                        <div className="welcome-text">
                            Welcome, {user.fullName}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE — NAVIGATION */}
                <nav className="header-nav">
                    <button onClick={() => navigate("/home/customers")}>Customers</button>
                    <button onClick={() => navigate("/home/add-appointment")}>Add Appointment</button>
                    <button onClick={() => navigate("/home/customers/add")}>Add Customer</button>
                    <button onClick={() => navigate("/home/accounting")}>Accounting</button>

                    <button onClick={() => navigate("/home/settings/profile")}>
                        Settings
                    </button>

                    <button
                        className="logout-btn"
                        onClick={() => {
                            localStorage.removeItem("token");
                            navigate("/login");
                        }}
                    >
                        Logout
                    </button>
                </nav>
            </header>

            <main className="content-area">
                <Outlet context={{ user }} />
            </main>
        </div>
    );
}

export default HomeLayout;
