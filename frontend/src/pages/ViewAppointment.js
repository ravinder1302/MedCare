import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Notification from "../components/Notification.js";
import "../styles/ViewAppointment.css";

const ViewAppointment = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const API_BASE = process.env.REACT_APP_API_URL || "";

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchAppointmentDetails();
  }, [appointmentId, navigate, token]);

  const fetchAppointmentDetails = async () => {
    try {
      console.log("Fetching appointment details...");
      console.log("Appointment ID:", appointmentId);
      console.log("Token:", token);
      console.log("User Role:", userRole);

      const response = await axios.get(
        `${API_BASE}/api/appointments/view/${appointmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API Response:", response);

      if (response.data) {
        console.log("Appointment data received:", response.data);
        setAppointment(response.data);
        setError(null);
      } else {
        console.error("No data in response");
        setError("No appointment data received");
      }
    } catch (err) {
      console.error("Error fetching appointment:", err);
      console.error("Error response:", err.response);
      console.error("Error message:", err.message);

      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to fetch appointment details"
      );

      if (err.response?.status === 401) {
        console.log("Unauthorized access, redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await axios.put(
        `${API_BASE}/api/appointments/update-status`,
        { id: appointmentId, status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      fetchAppointmentDetails();
    } catch (err) {
      setError("Failed to update appointment status");
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this appointment? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/api/appointments/${appointmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setNotification({
        message: "Appointment deleted successfully",
        type: "success",
      });

      // Redirect to appointments page after a short delay
      setTimeout(() => {
        navigate("/appointments");
      }, 2000);
    } catch (error) {
      setNotification({
        message:
          error.response?.data?.message || "Failed to delete appointment",
        type: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="view-appointment-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-appointment-container">
        <div className="error-state">
          <p>{error}</p>
          <button
            onClick={() => navigate("/appointments")}
            className="action-button back"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="view-appointment-container">
        <div className="error-state">
          <p>Appointment not found</p>
          <button
            onClick={() => navigate("/appointments")}
            className="action-button back"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  const isScheduled = appointment.status === "scheduled";
  const appointmentDate = new Date(appointment.appointment_date);
  const isUpcoming = appointmentDate > new Date();

  return (
    <div className="view-appointment-container">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="appointment-details-card">
        <div className="appointment-header">
          <h2>Appointment Details</h2>
          <span className={`status ${appointment.status.toLowerCase()}`}>
            {appointment.status}
          </span>
        </div>

        <div className="appointment-info-grid">
          <div className="info-group">
            <h3>Date & Time</h3>
            <p className="date">{appointmentDate.toLocaleDateString()}</p>
            <p className="time">
              {appointmentDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>

          <div className="info-group">
            <h3>{userRole === "doctor" ? "Patient" : "Doctor"}</h3>
            <p>
              {userRole === "doctor"
                ? appointment.patient_name
                : appointment.doctor_name}
            </p>
          </div>

          <div className="info-group">
            <h3>Symptoms</h3>
            <p className="symptoms-text">{appointment.symptoms}</p>
          </div>

          <div className="info-group">
            <h3>Notes</h3>
            <p className="notes-text">{appointment.notes}</p>
          </div>

          {appointment.prescription && (
            <div className="info-group">
              <h3>Prescription</h3>
              <p>{appointment.prescription}</p>
            </div>
          )}
        </div>

        <div style={{ margin: "24px 0" }}>
          <button
            className="action-button"
            onClick={() =>
              navigate("/lab-reports", {
                state: { patientId: appointment.patient_id },
              })
            }
            style={{ marginRight: 8 }}
          >
            View/Edit Lab Reports
          </button>
          <button
            className="action-button"
            onClick={() =>
              navigate("/medical-history", {
                state: { patientId: appointment.patient_id },
              })
            }
            style={{ marginRight: 8 }}
          >
            View/Edit Medical History
          </button>
          <button
            className="action-button"
            onClick={() =>
              navigate("/emergency", {
                state: { patientId: appointment.patient_id },
              })
            }
          >
            View/Edit Emergency Cases
          </button>
        </div>

        <div className="appointment-actions">
          {userRole === "doctor" && isScheduled && (
            <>
              <button
                onClick={() => handleStatusUpdate("completed")}
                className="action-button complete"
              >
                Mark as Completed
              </button>
              <button
                onClick={() => handleStatusUpdate("cancelled")}
                className="action-button cancel"
              >
                Cancel Appointment
              </button>
            </>
          )}
          {userRole === "patient" && isScheduled && isUpcoming && (
            <button
              onClick={() => handleStatusUpdate("cancelled")}
              className="action-button cancel"
            >
              Cancel Appointment
            </button>
          )}
          {(appointment.status === "completed" ||
            appointment.status === "cancelled" ||
            appointment.status === "rejected" ||
            appointment.status === "elapsed") && (
            <button onClick={handleDelete} className="action-button delete">
              Delete Appointment
            </button>
          )}
          <button
            onClick={() => navigate("/appointments")}
            className="action-button back"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewAppointment;
