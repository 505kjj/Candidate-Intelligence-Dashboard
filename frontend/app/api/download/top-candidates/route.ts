import fs from "fs";
import { NextResponse } from "next/server";
import { outputPaths } from "@/lib/candidates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  if (!fs.existsSync(outputPaths.topCandidates)) {
    return NextResponse.json({ message: "outputs/top_candidates.json not found." }, { status: 404 });
  }

  const file = fs.readFileSync(outputPaths.topCandidates);
  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="top_candidates.json"'
    }
  });
}
