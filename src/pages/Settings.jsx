// SettingsLayout.jsx
import { Outlet, NavLink } from "react-router-dom";
import "./Settings.css";

function SettingsLayout() {
    return (
        <div className="settings-container">
            <aside className="settings-sidebar">
                <NavLink to="profile" className="settings-link">Profile</NavLink>
                <NavLink to="preferences" className="settings-link">Preferences</NavLink>

                {/* ⭐ New Form Builder / Custom Forms section */}
                <NavLink to="forms" className="settings-link">Custom Forms</NavLink>

                <NavLink to="notifications" className="settings-link">Notifications</NavLink>
                <NavLink to="security" className="settings-link">Security</NavLink>
            </aside>

            <main className="settings-content">
                <Outlet />
            </main>
        </div>
    );
}

export default SettingsLayout;
