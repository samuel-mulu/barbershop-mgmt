import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req: Request) {
  await connectDB();

  const decoded = verifyToken(req);
  if (!decoded) return new Response("Unauthorized", { status: 401 });

  const user = await User.findById(decoded._id).select("-password");
  if (!user) return new Response("User not found", { status: 404 });

  return new Response(JSON.stringify(user), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
