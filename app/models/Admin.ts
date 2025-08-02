import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
}, { timestamps: true });

export default mongoose.models.Admin || mongoose.model("Admin", adminSchema); 