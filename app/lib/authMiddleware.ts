import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";

export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request) => {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { error: "Unauthorized", status: 401 };
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { _id: string; name: string; phone: string; role: string };
      const user = await User.findById(decoded._id);

      if (!user || !allowedRoles.includes(user.role)) {
        return { error: "Forbidden", status: 403 };
      }

      return { user };
    } catch {
      return { error: "Unauthorized", status: 401 };
    }
  };
};
