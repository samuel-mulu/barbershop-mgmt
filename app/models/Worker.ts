import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ["barber", "washer"], required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
}, { timestamps: true });

export default mongoose.models.Worker || mongoose.model("Worker", workerSchema); 