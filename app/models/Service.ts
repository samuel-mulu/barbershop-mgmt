import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
}, { timestamps: true });

export default mongoose.models.Service || mongoose.model("Service", serviceSchema); 