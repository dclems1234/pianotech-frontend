import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";   // <-- IMPORTANT: use your shared axios instance
import "./Form.css";

function Customers() {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        api.get("/customers")
            .then(res => setCustomers(res.data))
            .catch(err => console.error("Error loading customers:", err));
    }, []);

    return (
        <div className="page-container">
            <h1>Customers</h1>

            {/* BUTTON ROW */}
            <div className="customer-actions">
                <Link to="/home/customers/add" className="primary-btn">
                    Add Customer
                </Link>

                <button
                    className="primary-btn"
                    onClick={() => navigate("/home/schedule")}
                >
                    View Schedule
                </button>

                <button
                    className="primary-btn"
                    onClick={() => navigate("/home/add-appointment")}
                >
                    Schedule Appointment
                </button>
            </div>

            <input
                type="text"
                className="search-bar"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                    width: "96%",
                    padding: "10px 14px",
                    marginBottom: "20px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    fontSize: "1rem"
                }}
            />

            {/* CUSTOMER LIST */}
            {customers.length === 0 ? (
                <p>No customers found.</p>
            ) : (
                <div className="customer-list">
                    {customers
                        .filter(c =>
                            c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.city?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map(c => (
                            <div
                                key={c.id}
                                className="customer-card"
                                onClick={() => navigate(`/home/customers/${c.id}`)}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="customer-name">{c.fullName}</div>

                                <div className="customer-address">
                                    {c.address1}
                                    {c.address2 ? `, ${c.address2}` : ""}
                                    {c.city ? `, ${c.city}` : ""}
                                    {c.state ? `, ${c.state}` : ""}
                                    {c.postalCode ? ` ${c.postalCode}` : ""}
                                </div>

                                <div className="customer-details">
                                    <div><strong>Phone:</strong> {c.phone}</div>
                                    <div><strong>Email:</strong> {c.email}</div>
                                    <div><strong>Piano:</strong> {c.piano}</div>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}

export default Customers;

