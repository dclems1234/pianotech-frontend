import { useEffect, useState } from "react";
import api from "../../api";

export default function FormTemplateList() {
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        const res = await api.get("/forms/templates");
        setTemplates(res.data);
    };

    const deleteTemplate = async (id) => {
        if (!window.confirm("Delete this template?")) return;

        await api.delete(`/forms/templates/${id}`);
        loadTemplates();
    };

    return (
        <div className="settings-container">
            <h2>Custom Forms</h2>

            <button
                className="btn-primary"
                onClick={() => (window.location.href = "/home/settings/forms/new")}
            >
                Create New Template
            </button>

            <div className="template-list">
                {templates.map((t) => (
                    <div key={t.id} className="template-card">
                        <div>
                            <h3>{t.name}</h3>
                            <p>Created: {new Date(t.createdAt).toLocaleDateString()}</p>
                        </div>

                        <div className="template-actions">
                            <button
                                className="btn-secondary"
                                onClick={() =>
                                    (window.location.href = `/home/settings/forms/edit/${t.id}`)
                                }
                            >
                                Edit
                            </button>

                            <button
                                className="btn-danger"
                                onClick={() => deleteTemplate(t.id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

