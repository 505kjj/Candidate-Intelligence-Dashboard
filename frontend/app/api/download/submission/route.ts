import fs from "fs";
import { NextResponse } from "next/server";
import { outputPaths } from "@/lib/candidates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  if (!fs.existsSync(outputPaths.submission)) {
    return NextResponse.json({ message: "outputs/submission.csv not found." }, { status: 404 });
  }

  const file = fs.readFileSync(outputPaths.submission);
  return new NextResponse(file, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="submission.csv"'
    }
  });
}
