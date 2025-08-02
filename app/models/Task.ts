import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  service: { type: String, required: true }, // e.g. "haircut", "wash_with_scrub"
  type: { type: String, enum: ["barber", "washer"], required: true },
  status: { type: String, enum: ["assigned", "in_progress", "done", "confirmed"], default: "assigned" },
  assignedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },
  confirmedAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.Task || mongoose.model("Task", taskSchema); 