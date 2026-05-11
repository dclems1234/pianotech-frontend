// src/utils/time.js

function safeZone(tz) {
    if (!tz || typeof tz !== "string" || tz.trim() === "") {
        return "America/New_York";
    }
    return tz;
}

// ---------------------------------------------------------
// Formatting functions (no timezone conversion)
// ---------------------------------------------------------

export function formatDateTime(dateString) {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

export function formatDate(dateString) {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

export function formatTime(dateString) {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

// ---------------------------------------------------------
// Generate LOCAL timestamp string (no UTC conversion)
// Format: "YYYY-MM-DDTHH:mm:ss"
// ---------------------------------------------------------
export function nowInUserTimezoneISO() {
    const d = new Date();

    const pad = n => String(n).padStart(2, "0");

    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
