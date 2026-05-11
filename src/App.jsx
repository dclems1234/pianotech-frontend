import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

// Attach token to every axios request automatically
axios.defaults.headers.common["Authorization"] =
    `Bearer ${localStorage.getItem("token")}`;

import ProtectedRoute from "./ProtectedRoute";

import Login from "./pages/Login";
import HomeLayout from "./pages/HomeLayout";

import Customers from "./pages/Customers";
import AddCustomer from "./pages/AddCustomer";
import EditCustomer from "./pages/EditCustomer";
import CustomerDetails from "./pages/CustomerDetails";

import Schedule from "./pages/Schedule";
import AddAppointment from "./pages/AddAppointment";
import AppointmentDetails from "./pages/AppointmentDetails";
import EditAppointment from "./pages/EditAppointment";

import Accounting from "./pages/Accounting";

import Users from "./pages/Users";
import AddUser from "./pages/AddUser";

// SETTINGS
import SettingsLayout from "./pages/settings/SettingsLayout";
import ProfileSettings from "./pages/settings/ProfileSettings";
import PreferenceSettings from "./pages/settings/PreferenceSettings";
import NotificationSettings from "./pages/settings/NotificationSettings";
import SecuritySettings from "./pages/settings/SecuritySettings";
import ServiceSettings from "./pages/settings/ServiceSettings";

import FormTemplateList from "./pages/settings/FormTemplateList";
import FormTemplateBuilder from "./pages/settings/FormTemplateBuilder";

import FillFormPage from "./pages/forms/FillFormPage";
import ViewFormResponsePage from "./pages/forms/ViewFormResponsePage";

function App() {
    return (
        <Router>
            <Routes>

                {/* Public route */}
                <Route path="/login" element={<Login />} />

                {/* Protected Home Layout */}
                <Route
                    path="/home"
                    element={
                        <ProtectedRoute>
                            <HomeLayout />   {/* ⭐ user is loaded here */}
                        </ProtectedRoute>
                    }
                >

                    {/* Default dashboard content */}
                    <Route index element={<Schedule />} />

                    {/* Customers */}
                    <Route path="customers" element={<Customers />} />
                    <Route path="customers/add" element={<AddCustomer />} />
                    <Route path="customers/:id" element={<CustomerDetails />} />
                    <Route path="customers/edit/:id" element={<EditCustomer />} />

                    {/* Scheduling */}
                    <Route path="schedule" element={<Schedule />} />
                    <Route path="add-appointment" element={<AddAppointment />} />
                    <Route path="appointments/:id" element={<AppointmentDetails />} />
                    <Route path="edit-appointment/:id" element={<EditAppointment />} />

                    {/* Accounting */}
                    <Route path="accounting" element={<Accounting />} />

                    {/* Users */}
                    <Route path="users" element={<Users />} />
                    <Route path="users/add" element={<AddUser />} />

                    {/* Settings */}
                    <Route path="settings" element={<SettingsLayout />}>
                        <Route path="profile" element={<ProfileSettings />} />
                        <Route path="preferences" element={<PreferenceSettings />} />
                        <Route path="notifications" element={<NotificationSettings />} />
                        <Route path="security" element={<SecuritySettings />} />
                        <Route path="services" element={<ServiceSettings />} />

                        {/* Form Builder */}
                        <Route path="forms" element={<FormTemplateList />} />
                        <Route path="forms/new" element={<FormTemplateBuilder />} />
                        <Route path="forms/edit/:id" element={<FormTemplateBuilder />} />
                    </Route>

                    {/* Form Fill + View */}
                    <Route
                        path="customers/:customerId/forms/fill/:templateId"
                        element={<FillFormPage />}
                    />
                    <Route
                        path="forms/responses/:responseId"
                        element={<ViewFormResponsePage />}
                    />

                </Route>

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="*" element={<Navigate to="/login" />} />

            </Routes>
        </Router>
    );
}

export default App;



