import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  barberPrice: { type: Number, required: false },
  washerPrice: { type: Number, required: false },
}, { _id: false });

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true },
  services: [serviceSchema],
}, { timestamps: true });

export default mongoose.models.Branch || mongoose.model("Branch", branchSchema); 