import fs from "fs";
import { NextResponse } from "next/server";
import { outputPaths } from "@/lib/candidates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    const filePath = fs.existsSync(outputPaths.topCandidates)
      ? outputPaths.topCandidates
      : fs.existsSync(outputPaths.bundledTopCandidates)
        ? outputPaths.bundledTopCandidates
        : null;

    if (!filePath) {
      return NextResponse.json(
        {
          success: false,
          message: "Generated output file not found. Run backend locally and copy outputs into frontend/public/generated.",
          path: "outputs/top_candidates.json"
        },
        { status: 404 }
      );
    }

    const file = fs.readFileSync(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="top_candidates.json"'
      }
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to read outputs/top_candidates.json in this environment.",
        path: "outputs/top_candidates.json"
      },
      { status: 500 }
    );
  }
}
