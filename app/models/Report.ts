import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  timestamp: { type: Date, default: Date.now },
  price: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.models.Report || mongoose.model("Report", reportSchema); 