const MedicalHistory = require("../models/medicalHistoryModel");

// Get medical history
const getMedicalHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = {};
    if (userRole === "patient") {
      query.patient_id = userId;
    } else if (userRole === "doctor") {
      query.doctor_id = userId;
    }

    const medicalHistory = await MedicalHistory.find(query)
      .populate("patient_id", "name email")
      .populate("doctor_id", "name email")
      .sort({ history_date: -1 });

    res.json(medicalHistory);
  } catch (err) {
    console.error("Error fetching medical history:", err);
    res.status(500).json({ message: "Failed to fetch medical history" });
  }
};

// Add medical history
const addMedicalHistory = async (req, res) => {
  try {
    const { patient_id, history, history_date } = req.body;
    const doctor_id = req.user.id;

    const medicalHistory = await MedicalHistory.create({
      patient_id,
      doctor_id,
      history,
      history_date: history_date || new Date(),
    });

    res.status(201).json(medicalHistory);
  } catch (err) {
    console.error("Error adding medical history:", err);
    res.status(500).json({ message: "Failed to add medical history" });
  }
};

// Update medical history
const updateMedicalHistory = async (req, res) => {
  try {
    const { id, history, history_date } = req.body;

    const medicalHistory = await MedicalHistory.findByIdAndUpdate(
      id,
      { history, history_date },
      { new: true }
    );

    if (!medicalHistory) {
      return res.status(404).json({ message: "Medical history not found" });
    }

    res.json(medicalHistory);
  } catch (err) {
    console.error("Error updating medical history:", err);
    res.status(500).json({ message: "Failed to update medical history" });
  }
};

// Delete medical history
const deleteMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const medicalHistory = await MedicalHistory.findByIdAndDelete(id);

    if (!medicalHistory) {
      return res.status(404).json({ message: "Medical history not found" });
    }

    res.json({ message: "Medical history deleted successfully" });
  } catch (err) {
    console.error("Error deleting medical history:", err);
    res.status(500).json({ message: "Failed to delete medical history" });
  }
};

module.exports = {
  getMedicalHistory,
  addMedicalHistory,
  updateMedicalHistory,
  deleteMedicalHistory,
};
