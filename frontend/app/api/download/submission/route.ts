import fs from "fs";
import { NextResponse } from "next/server";
import { outputPaths } from "@/lib/candidates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    const filePath = fs.existsSync(outputPaths.submission)
      ? outputPaths.submission
      : fs.existsSync(outputPaths.bundledSubmission)
        ? outputPaths.bundledSubmission
        : null;

    if (!filePath) {
      return NextResponse.json(
        {
          success: false,
          message: "Generated output file not found. Run backend locally and copy outputs into frontend/public/generated.",
          path: "outputs/submission.csv"
        },
        { status: 404 }
      );
    }

    const file = fs.readFileSync(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="submission.csv"'
      }
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to read outputs/submission.csv in this environment.",
        path: "outputs/submission.csv"
      },
      { status: 500 }
    );
  }
}
