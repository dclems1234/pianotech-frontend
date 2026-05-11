import { useEffect, useState } from "react";
import api from "../api";
import "./Accounting.css";
import { formatDateTime } from "../utils/time";
import { useOutletContext } from "react-router-dom";

function Accounting() {
    // ⭐ Get user from HomeLayout
    const { user } = useOutletContext();
    if (!user) return <div>Loading...</div>;

    // ⭐ Branding
    const companyName = user.companyName || "PianoTech Pro";
    const companyLogo = user.companyLogoUrl || "/assets/pianotechpro-logo.png";

    const [payments, setPayments] = useState([]);
    const [filtered, setFiltered] = useState([]);

    const [filters, setFilters] = useState({
        customer: "",
        method: "",
        status: "",
        startDate: "",
        endDate: ""
    });

    // ---------------------------------------------------------
    // Load all payments
    // ---------------------------------------------------------
    useEffect(() => {
        api.get("/appointment-payments/all")
            .then(res => {
                setPayments(res.data);
                setFiltered(res.data);
            })
            .catch(err => console.error("Error loading payments:", err));
    }, []);

    // ---------------------------------------------------------
    // Apply filters (Local‑time safe)
    // ---------------------------------------------------------
    function applyFilters() {
        let list = [...payments];

        // Customer filter
        if (filters.customer) {
            const search = filters.customer.toLowerCase();
            list = list.filter(p =>
                p.appointment.customer.fullName.toLowerCase().includes(search)
            );
        }

        // Method filter
        if (filters.method) {
            list = list.filter(p => p.method === filters.method);
        }

        // Status filter
        if (filters.status) {
            list = list.filter(p => p.status === filters.status);
        }

        // ⭐ Date filtering (timestamps are already LOCAL)
        if (filters.startDate) {
            const start = new Date(filters.startDate);
            list = list.filter(p => new Date(p.paidAt) >= start);
        }

        if (filters.endDate) {
            const end = new Date(filters.endDate);
            list = list.filter(p => new Date(p.paidAt) <= end);
        }

        setFiltered(list);
    }

    useEffect(applyFilters, [filters, payments]);

    // ---------------------------------------------------------
    // Print Receipt (Branding + Local Time)
    // ---------------------------------------------------------
    function printReceipt(payment) {
        const win = window.open("", "_blank");

        win.document.write(`
            <div style="text-align:center; margin-bottom:20px;">
                <img 
                    src="${companyLogo}" 
                    style="width:160px; height:auto; object-fit:contain; margin-bottom:10px;"
                />
                <h2 style="margin:0;">${companyName}</h2>
            </div>

            <h1>Payment Receipt</h1>

            <p><strong>Customer:</strong> ${payment.appointment.customer.fullName}</p>
            <p><strong>Service:</strong> ${payment.appointment.service?.name || "None"}</p>
            <p><strong>Appointment Date:</strong> ${formatDateTime(payment.appointment.startTime)}</p>

            <hr/>

            <p><strong>Amount:</strong> $${payment.amount.toFixed(2)}</p>
            <p><strong>Method:</strong> ${payment.method}</p>
            <p><strong>Status:</strong> ${payment.status}</p>
            <p><strong>Date Paid:</strong> ${formatDateTime(payment.paidAt)}</p>
            <p><strong>Notes:</strong> ${payment.notes || ""}</p>

            <hr/>
            <p>Thank you for your business!</p>
        `);

        win.print();
        win.close();
    }

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------
    return (
        <div className="page-container">
            <h1>Accounting</h1>

            {/* Filters */}
            <div className="filters">
                <input
                    type="text"
                    placeholder="Search customer..."
                    value={filters.customer}
                    onChange={e => setFilters({ ...filters, customer: e.target.value })}
                />

                <select
                    value={filters.method}
                    onChange={e => setFilters({ ...filters, method: e.target.value })}
                >
                    <option value="">Method...</option>
                    <option>Cash</option>
                    <option>Card</option>
                    <option>Check</option>
                    <option>Venmo</option>
                    <option>PayPal</option>
                    <option>Zelle</option>
                </select>

                <select
                    value={filters.status}
                    onChange={e => setFilters({ ...filters, status: e.target.value })}
                >
                    <option value="">Status...</option>
                    <option>Paid</option>
                    <option>Partial</option>
                    <option>Unpaid</option>
                </select>

                <input
                    type="date"
                    value={filters.startDate}
                    onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                />

                <input
                    type="date"
                    value={filters.endDate}
                    onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                />
            </div>

            {/* Totals */}
            <div className="totals-card">
                <div>
                    <strong>Total Payments:</strong>{" "}
                    ${filtered.reduce((s, p) => s + p.amount, 0).toFixed(2)}
                </div>
                <div><strong>Count:</strong> {filtered.length}</div>
            </div>

            {/* Payments Table */}
            <table className="payments-table">
                <thead>
                    <tr>
                        <th>Date Paid</th>
                        <th>Customer</th>
                        <th>Service</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Receipt</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(p => (
                        <tr key={p.id}>
                            <td>{formatDateTime(p.paidAt)}</td>
                            <td>{p.appointment.customer.fullName}</td>
                            <td>{p.appointment.service?.name || "None"}</td>
                            <td>${p.amount.toFixed(2)}</td>
                            <td>{p.method}</td>
                            <td>{p.status}</td>
                            <td>
                                <button
                                    className="primary-btn"
                                    onClick={() => printReceipt(p)}
                                >
                                    Print
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Accounting;
