import { useState, useEffect } from "react";
import api from "../../api";   // <-- correct path for src/pages/settings

function ProfileSettings() {
    const [profile, setProfile] = useState({
        fullName: "",
        username: "",
        role: ""
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [message, setMessage] = useState("");

    // Load current user profile
    useEffect(() => {
        api.get("/users/me")
            .then(res => setProfile(res.data))
            .catch(err => console.error(err));
    }, []);

    // Save profile changes (Full Name only)
    const handleProfileSave = async () => {
        try {
            await api.put("/users/me", {
                fullName: profile.fullName
            });

            setMessage("Profile updated successfully.");
        } catch (err) {
            setMessage("Error updating profile.");
        }
    };

    // Change password
    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage("New passwords do not match.");
            return;
        }

        try {
            await api.put("/users/change-password", {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            setMessage("Password updated successfully.");
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
        } catch (err) {
            setMessage("Error updating password.");
        }
    };

    return (
        <div>
            <h1>Profile</h1>

            {message && (
                <div style={{ marginBottom: "15px", color: "green" }}>
                    {message}
                </div>
            )}

            <div className="details-card">
                <label>Full Name</label>
                <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) =>
                        setProfile({ ...profile, fullName: e.target.value })
                    }
                />

                <label>Username (read-only)</label>
                <input type="text" value={profile.username} disabled />

                <label>Role (read-only)</label>
                <input type="text" value={profile.role} disabled />

                <button className="primary-btn" onClick={handleProfileSave}>
                    Save Profile
                </button>
            </div>

            <h2 style={{ marginTop: "30px" }}>Change Password</h2>

            <div className="details-card">
                <label>Current Password</label>
                <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                        setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value
                        })
                    }
                />

                <label>New Password</label>
                <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                        setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value
                        })
                    }
                />

                <label>Confirm New Password</label>
                <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                        setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value
                        })
                    }
                />

                <button className="primary-btn" onClick={handlePasswordChange}>
                    Update Password
                </button>
            </div>
        </div>
    );
}

export default ProfileSettings;