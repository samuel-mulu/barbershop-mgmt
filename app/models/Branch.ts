import mongoose from "mongoose";

const shareSettingsSchema = new mongoose.Schema({
  barberShare: { type: Number, default: 50, min: 0, max: 100 }, // Default 50%
  washerShare: { type: Number, default: 10, min: 0, max: 100 }, // Default 10%
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  barberPrice: { type: Number, required: false },
  washerPrice: { type: Number, required: false },
  shareSettings: { type: shareSettingsSchema, default: () => ({ barberShare: 50, washerShare: 10 }) },
}, { _id: false });

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true },
  services: [serviceSchema],
}, { timestamps: true });

export default mongoose.models.Branch || mongoose.model("Branch", branchSchema); 