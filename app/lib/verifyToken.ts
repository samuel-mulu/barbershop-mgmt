import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";

interface DecodedToken {
  _id: string;
  name: string;
  phone: string;
  role: string;
  iat: number;
  exp: number;
}

export const verifyToken = (req: Request): DecodedToken | null => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No valid authorization header found");
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "object" && decoded !== null && "_id" in decoded && "name" in decoded && "phone" in decoded && "role" in decoded && "iat" in decoded && "exp" in decoded) {
      console.log("Token verified successfully for user:", decoded);
      return decoded as DecodedToken;
    } else {
      console.error("Decoded token does not match expected structure:", decoded);
      return null;
    }
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};
