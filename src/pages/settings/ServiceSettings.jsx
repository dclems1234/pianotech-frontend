import { useState, useEffect } from "react";
import api from "../../api";   // <-- correct path for src/pages/settings

function ServiceSettings() {
    const [services, setServices] = useState([]);
    const [newService, setNewService] = useState({
        name: "",
        durationMinutes: "",
        description: "",
        cost: ""
    });

    const [message, setMessage] = useState("");

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = () => {
        api.get("/services")
            .then(res => setServices(res.data))
            .catch(err => console.error(err));
    };

    const addService = () => {
        api.post("/services", newService)
            .then(() => {
                setMessage("Service added.");
                setNewService({ name: "", durationMinutes: "", description: "", cost: "" });
                loadServices();
            })
            .catch(() => setMessage("Error adding service."));
    };

    const deleteService = (id) => {
        api.delete(`/services/${id}`)
            .then(() => {
                setMessage("Service deleted.");
                loadServices();
            })
            .catch(() => setMessage("Error deleting service."));
    };

    return (
        <div>
            <h1>Service Settings</h1>

            {message && <p style={{ color: "green" }}>{message}</p>}

            <div className="details-card">
                <h2>Add New Service</h2>

                <label>Name</label>
                <input
                    type="text"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                />

                <label>Duration (minutes)</label>
                <input
                    type="number"
                    value={newService.durationMinutes}
                    onChange={(e) => setNewService({ ...newService, durationMinutes: e.target.value })}
                />

                <label>Description</label>
                <textarea
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                />

                <label>Cost ($)</label>
                <input
                    type="number"
                    value={newService.cost}
                    onChange={(e) => setNewService({ ...newService, cost: e.target.value })}
                />

                <button className="primary-btn" onClick={addService}>
                    Add Service
                </button>
            </div>

            <h2 style={{ marginTop: "30px" }}>Existing Services</h2>

            {services.map((s) => (
                <div key={s.id} className="details-card" style={{ marginBottom: "15px" }}>
                    <strong>{s.name}</strong> — {s.durationMinutes} mins — ${s.cost}
                    <p>{s.description}</p>

                    <button
                        className="delete-btn"
                        onClick={() => deleteService(s.id)}
                    >
                        Delete
                    </button>
                </div>
            ))}
        </div>
    );
}

export default ServiceSettings;
