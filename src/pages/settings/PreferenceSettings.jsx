import { useEffect, useState } from "react";
import api from "../../api";

function PreferenceSettings() {
    const [user, setUser] = useState(null);

    const [saving, setSaving] = useState(false);
    const [brandingSaving, setBrandingSaving] = useState(false);

    // ⭐ Local branding state
    const [branding, setBranding] = useState({
        companyName: "",
        companyLogoUrl: ""
    });

    // All valid IANA timezones
    const timezones = Intl.supportedValuesOf("timeZone");

    // ---------------------------------------------------------
    // Load user + initialize branding
    // ---------------------------------------------------------
    useEffect(() => {
        api.get("/users/me")
            .then(res => {
                setUser(res.data);

                setBranding({
                    companyName: res.data.companyName || "",
                    companyLogoUrl: res.data.companyLogoUrl || ""
                });
            })
            .catch(err => console.error("Error loading user:", err));
    }, []);

    // ---------------------------------------------------------
    // UPDATE TIMEZONE
    // ---------------------------------------------------------
    async function updateTimezone(tz) {
        setSaving(true);
        try {
            await api.put("/users/me/timezone", { timeZone: tz });
            setUser(prev => ({ ...prev, timeZone: tz }));
        } catch (err) {
            console.error("Error updating timezone:", err);
        }
        setSaving(false);
    }

    // ---------------------------------------------------------
    // SAVE BRANDING (Company Name + Logo URL)
    // ---------------------------------------------------------
    async function saveBranding() {
        setBrandingSaving(true);
        try {
            await api.put("/users/me/branding", branding);

            // Update user state after saving
            setUser(prev => ({
                ...prev,
                companyName: branding.companyName,
                companyLogoUrl: branding.companyLogoUrl
            }));
        } catch (err) {
            console.error("Error saving branding:", err);
        }
        setBrandingSaving(false);
    }

    // ---------------------------------------------------------
    // UPLOAD LOGO (Preview only — does NOT save yet)
    // ---------------------------------------------------------
    async function handleLogoUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await api.post("/users/me/logo", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const url = res.data.url;

            // ⭐ Only update local preview — user must click Save Branding
            setBranding(prev => ({ ...prev, companyLogoUrl: url }));
        } catch (err) {
            console.error("Logo upload failed:", err);
        }
    }

    if (!user) return <div>Loading...</div>;

    const safeZone = user.timeZone || "America/New_York";

    // ⭐ Build full logo URL for preview
    const previewLogo = branding.companyLogoUrl
        ? `http://192.168.5.231:5000${branding.companyLogoUrl}`
        : null;

    return (
        <div>
            <h1>Preferences</h1>
            <p>Customize your PianoTech Pro experience, including branding and timezone.</p>

            {/* BRANDING SETTINGS */}
            <div
                style={{
                    marginTop: "25px",
                    padding: "20px",
                    borderRadius: "10px",
                    background: "#f7f7f7",
                    border: "1px solid #ddd"
                }}
            >
                <h3>Branding</h3>
                <p>Your company name and logo appear on receipts, payments, and PDFs.</p>

                {/* Company Name */}
                <label style={{ fontWeight: "bold" }}>Company Name</label>
                <input
                    type="text"
                    className="form-input"
                    style={{ width: "100%", padding: "10px", marginTop: "5px" }}
                    value={branding.companyName}
                    onChange={e =>
                        setBranding(prev => ({ ...prev, companyName: e.target.value }))
                    }
                />

                {/* Logo Upload */}
                <label style={{ fontWeight: "bold", marginTop: "15px", display: "block" }}>
                    Company Logo
                </label>
                <input type="file" onChange={handleLogoUpload} />

                {/* Logo Preview */}
                {previewLogo && (
                    <div style={{ marginTop: "15px" }}>
                        <strong>Preview:</strong>
                        <br />
                        <img
                            src={previewLogo}
                            alt="Company Logo"
                            style={{
                                width: "180px",
                                height: "auto",
                                marginTop: "10px",
                                border: "1px solid #ccc",
                                borderRadius: "6px",
                                background: "white",
                                padding: "5px"
                            }}
                        />
                    </div>
                )}

                {/* SAVE BUTTON */}
                <button
                    className="primary-btn"
                    style={{ marginTop: "20px", width: "200px" }}
                    onClick={saveBranding}
                    disabled={brandingSaving}
                >
                    {brandingSaving ? "Saving..." : "Save Branding"}
                </button>
            </div>

            {/* TIMEZONE SETTINGS */}
            <div
                style={{
                    marginTop: "25px",
                    padding: "20px",
                    borderRadius: "10px",
                    background: "#f7f7f7",
                    border: "1px solid #ddd"
                }}
            >
                <h3>Timezone</h3>
                <p>Select the timezone used for appointments, payments, receipts, and schedules.</p>

                <select
                    className="form-input"
                    style={{ width: "100%", padding: "10px", marginTop: "10px" }}
                    value={safeZone}
                    onChange={e => updateTimezone(e.target.value)}
                >
                    {timezones.map(tz => (
                        <option key={tz} value={tz}>
                            {tz}
                        </option>
                    ))}
                </select>

                {/* LIVE PREVIEW */}
                <div style={{ marginTop: "15px", fontSize: "0.9rem", color: "#444" }}>
                    <strong>Current time in {safeZone}:</strong>
                    <br />
                    {new Date().toLocaleString("en-US", {
                        timeZone: safeZone,
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        month: "long",
                        day: "numeric"
                    })}
                </div>

                {saving && (
                    <div style={{ marginTop: "10px", color: "#007bff" }}>
                        Saving timezone…
                    </div>
                )}
            </div>
        </div>
    );
}

export default PreferenceSettings;




