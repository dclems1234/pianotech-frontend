import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import api from "../api";
import "./Schedule.css";

// Timezone helpers
import { formatDate, formatTime, formatDateTime } from "../utils/time";

function Schedule() {
    const navigate = useNavigate();

    // ⭐ Get user from HomeLayout Outlet context
    const { user } = useOutletContext();

    // ⭐ Prevent crash if user not loaded yet
    if (!user) return <div>Loading...</div>;

    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + 1;
        return new Date(d.setDate(diff));
    }

    const today = new Date();
    const [weekStart, setWeekStart] = useState(getWeekStart(today));
    const [appointments, setAppointments] = useState([]);

    // ⭐ API date formatting (not timezone)
    function formatApiDate(d) {
        return d.toISOString().split("T")[0];
    }

    // ⭐ Load weekly appointments
    useEffect(() => {
        const start = new Date(weekStart);
        const end = new Date(weekStart);
        end.setDate(end.getDate() + 7);

        api.get(
            `/appointments/week?start=${formatApiDate(start)}&end=${formatApiDate(end)}`
        )
            .then((res) => setAppointments(res.data))
            .catch((err) =>
                console.error("Error loading weekly appointments:", err)
            );
    }, [weekStart]);

    function prevWeek() {
        const d = new Date(weekStart);
        d.setDate(d.getDate() - 7);
        setWeekStart(d);
    }

    function nextWeek() {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        setWeekStart(d);
    }

    function goToday() {
        setWeekStart(getWeekStart(new Date()));
    }

    function handleDayClick(date) {
        setWeekStart(getWeekStart(date));
        navigate(`/home/add-appointment?date=${formatApiDate(date)}`);
    }

    function handleApptClick(id) {
        navigate(`/home/appointments/${id}`);
    }

    const days = [...Array(7)].map((_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
    });

    return (
        <div className="schedule-container">
            <h1>Weekly Schedule</h1>

            <div className="week-nav">
                <button onClick={prevWeek}>← Previous</button>
                <button onClick={goToday}>Today</button>
                <button onClick={nextWeek}>Next →</button>
            </div>

            <div className="week-grid">
                {days.map((day, idx) => {
                    // ⭐ Convert day to user's timezone
                    const dayStr = formatDate(day, user.timeZone);

                    const dayAppts = appointments
                        .filter((a) =>
                            formatDate(a.startTime, user.timeZone) === dayStr
                        )
                        .sort(
                            (a, b) =>
                                new Date(a.startTime) -
                                new Date(b.startTime)
                        );

                    return (
                        <div
                            key={idx}
                            className="week-day-column"
                            onClick={() => handleDayClick(day)}
                        >
                            {/* ⭐ Day header in user's timezone */}
                            <div className="week-day-header">
                                {formatDate(day, user.timeZone)}
                            </div>

                            {dayAppts.map((a) => (
                                <div
                                    key={a.id}
                                    className="week-appt"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleApptClick(a.id);
                                    }}
                                >
                                    <strong>{a.customer.fullName}</strong>
                                    <div style={{ fontSize: "1em", opacity: 0.8 }}>
                                        {a.service?.name || "No Service"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Schedule;

