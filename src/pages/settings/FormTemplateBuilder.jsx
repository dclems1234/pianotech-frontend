import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function FormTemplateBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [templateName, setTemplateName] = useState("");
    const [fields, setFields] = useState([]);

    useEffect(() => {
        if (id) loadTemplate();
    }, [id]);

    const loadTemplate = async () => {
        const res = await api.get(`/forms/templates/${id}`);

        const normalized = (res.data.fields || []).map(f => ({
            ...f,
            options: f.optionsJson ? JSON.parse(f.optionsJson) : []
        }));

        setTemplateName(res.data.name);
        setFields(normalized);
    };

    const saveTemplate = async () => {
        if (!templateName.trim()) {
            alert("Template name is required");
            return;
        }

        if (!id) {
            const res = await api.post("/forms/templates", {
                name: templateName,
                createdBy: 1
            });

            navigate(`/home/settings/forms/edit/${res.data.id}`);
        } else {
            await api.put(`/forms/templates/${id}`, {
                id,
                name: templateName
            });

            alert("Template saved");
        }
    };

    // ⭐ Add Field (supports Signature)
    const addField = async (type) => {
        if (!id) {
            alert("Save the template before adding fields.");
            return;
        }

        const normalizedType = {
            title: "Title",
            text: "Text",
            choice: "Choice",
            multichoice: "MultiChoice",
            photo: "Photo",
            signature: "Signature"   // ⭐ FIXED + ADDED
        }[type];

        const isChoiceType = type === "choice" || type === "multichoice";

        const payload = {
            id: 0,
            templateId: Number(id),
            type: normalizedType,
            label: normalizedType === "Signature" ? "Signature" : "New Field",
            optionsJson: isChoiceType ? JSON.stringify([]) : "[]",
            order: fields.length + 1
        };

        const res = await api.post(`/forms/fields/${id}`, payload);
        setFields([...fields, { ...res.data, options: [] }]);
    };

    // ⭐ Update Field
    const updateField = async (fieldId, updated) => {
        const payload = {
            ...updated,
            optionsJson: JSON.stringify(updated.options || [])
        };

        await api.put(`/forms/fields/${fieldId}`, payload);

        setFields(fields.map(f =>
            f.id === fieldId ? { ...f, ...updated } : f
        ));
    };

    // ⭐ Delete Field
    const deleteField = async (fieldId) => {
        await api.delete(`/forms/fields/${fieldId}`);
        setFields(fields.filter(f => f.id !== fieldId));
    };

    // ⭐ Drag & Drop Reordering
    const onDragEnd = async (result) => {
        if (!result.destination) return;

        const reordered = Array.from(fields);
        const [moved] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, moved);

        const orderedIds = reordered.map(f => f.id);

        await api.post(`/forms/fields/reorder/${id}`, orderedIds);
        setFields(reordered);
    };

    return (
        <div className="form-builder-container">
            <h2>{id ? "Edit Template" : "Create Template"}</h2>

            <div className="form-builder-header">
                <input
                    type="text"
                    placeholder="Template Name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                />

                <button className="btn-primary" onClick={saveTemplate}>
                    Save Template
                </button>
            </div>

            {!id && (
                <p className="info-text">
                    Save the template first before adding fields.
                </p>
            )}

            {id && (
                <>
                    <h3>Fields</h3>

                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="fields">
                            {(provided) => (
                                <div
                                    className="field-list"
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                >
                                    {fields.map((field, index) => (
                                        <Draggable
                                            key={field.id}
                                            draggableId={field.id.toString()}
                                            index={index}
                                        >
                                            {(provided) => (
                                                <div
                                                    className="field-card"
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                >
                                                    <div className="field-main">
                                                        <input
                                                            type="text"
                                                            value={field.label}
                                                            onChange={(e) =>
                                                                updateField(field.id, {
                                                                    ...field,
                                                                    label: e.target.value
                                                                })
                                                            }
                                                        />

                                                        <span className="field-type">{field.type}</span>

                                                        <button
                                                            className="btn-danger"
                                                            onClick={() => deleteField(field.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>

                                                    {/* ⭐ Choice + MultiChoice Options */}
                                                    {(field.type.toLowerCase() === "choice" ||
                                                        field.type.toLowerCase() === "multichoice") && (
                                                            <div className="choice-options">
                                                                {field.options?.map((opt, idx) => (
                                                                    <div key={idx} className="choice-option-row">
                                                                        <input
                                                                            type="text"
                                                                            value={opt}
                                                                            onChange={(e) => {
                                                                                const updatedOptions = [...field.options];
                                                                                updatedOptions[idx] = e.target.value;

                                                                                updateField(field.id, {
                                                                                    ...field,
                                                                                    options: updatedOptions
                                                                                });
                                                                            }}
                                                                        />

                                                                        <button
                                                                            className="btn-danger"
                                                                            onClick={() => {
                                                                                const updatedOptions = field.options.filter(
                                                                                    (_, i) => i !== idx
                                                                                );

                                                                                updateField(field.id, {
                                                                                    ...field,
                                                                                    options: updatedOptions
                                                                                });
                                                                            }}
                                                                        >
                                                                            X
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                                <button
                                                                    className="btn-secondary"
                                                                    onClick={() => {
                                                                        const updatedOptions = [
                                                                            ...(field.options || []),
                                                                            "New Option"
                                                                        ];

                                                                        updateField(field.id, {
                                                                            ...field,
                                                                            options: updatedOptions
                                                                        });
                                                                    }}
                                                                >
                                                                    + Add Option
                                                                </button>
                                                            </div>
                                                        )}

                                                    {/* ⭐ Signature Field Preview */}
                                                    {field.type.toLowerCase() === "signature" && (
                                                        <div className="signature-preview">
                                                            <em>This field will capture a signature during form completion.</em>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}

                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    <h3>Add Field</h3>

                    <div className="add-field-buttons">
                        <button onClick={() => addField("title")}>Title</button>
                        <button onClick={() => addField("text")}>Text Input</button>
                        <button onClick={() => addField("choice")}>Choice Field</button>
                        <button onClick={() => addField("multichoice")}>Multi‑Select Field</button>
                        <button onClick={() => addField("photo")}>Photo Upload</button>
                        <button onClick={() => addField("signature")}>Signature</button>
                    </div>
                </>
            )}
        </div>
    );
}





