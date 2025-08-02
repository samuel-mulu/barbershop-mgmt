import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  services: [{ type: String, required: true }], // e.g. ["haircut", "wash_with_scrub"]
  barberId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  washerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "assigned", "in_progress", "done", "confirmed"], default: "pending" },
  appointmentDateGregorian: { type: Date, required: true },
  appointmentDateEthiopian: { type: String, required: true },
  branch: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String },
}, { timestamps: true });

export default mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema); 