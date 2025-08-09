import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  // quick and light response for heartbeat checks
  res.status(200).json({ ok: true, time: Date.now() });
}
