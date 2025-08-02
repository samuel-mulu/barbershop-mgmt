import mongoose from "mongoose";

const ownerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "owner" },
  branches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }],
}, { timestamps: true });

export default mongoose.models.Owner || mongoose.model("Owner", ownerSchema); 