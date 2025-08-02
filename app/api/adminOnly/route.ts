import { requireRole } from "@/lib/authMiddleware";

export async function GET(req: Request) {
  const { user, error, status } = await requireRole(["admin"])(req);

  if (error) {
    return new Response(error, { status });
  }

  return new Response(
    JSON.stringify({ message: `Hello ${user.name}, welcome Admin!` }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
