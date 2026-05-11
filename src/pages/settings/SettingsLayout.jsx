// SettingsLayout.jsx
import { Outlet, NavLink } from "react-router-dom";
import "./Settings.css";

function SettingsLayout() {
    return (
        <div className="settings-container">
            <aside className="settings-sidebar">
                <NavLink to="profile" className="settings-link">Profile</NavLink>
                <NavLink to="preferences" className="settings-link">Preferences</NavLink>
                <NavLink to="forms" className="settings-link">Form Builder</NavLink>
                <NavLink to="notifications" className="settings-link">Notifications</NavLink>
                <NavLink to="security" className="settings-link">Security</NavLink>
                <NavLink
                    to="services"
                    className={({ isActive }) => isActive ? "settings-link active" : "settings-link"}
                >
                    Services
                </NavLink>
            </aside>

            <main className="settings-content">
                <Outlet />
            </main>
        </div>
    );
}

export default SettingsLayout;