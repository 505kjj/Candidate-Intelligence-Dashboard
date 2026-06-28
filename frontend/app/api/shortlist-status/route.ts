import { NextResponse } from "next/server";
import { getShortlistStatus } from "@/lib/candidates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    return NextResponse.json(getShortlistStatus());
  } catch {
    return NextResponse.json({
      localOutputExists: false,
      bundledOutputExists: false,
      submissionExists: false,
      jsonExists: false,
      ready: false,
      candidateCount: 0,
      submissionModifiedAt: null,
      jsonModifiedAt: null,
      submissionPath: "outputs/submission.csv",
      jsonPath: "outputs/top_candidates.json",
      source: "demo",
      message: "Unable to read local output status in this environment."
    });
  }
}
