import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";   // <-- correct path for src/pages/

function Users() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        api.get("/users")
            .then(res => setUsers(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="page-container">
            <h1>User Management</h1>

            <button
                className="primary-btn"
                onClick={() => navigate("/users/add")}
            >
                Add User
            </button>

            <table className="modern-table">
                <thead>
                    <tr>
                        <th>Full Name</th>
                        <th>Username</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td>{u.fullName}</td>
                            <td>{u.username}</td>
                            <td>{u.role}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Users;