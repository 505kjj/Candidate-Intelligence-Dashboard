import { NextResponse } from "next/server";
import { demoCandidates, getCandidatesResponse } from "@/lib/candidates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    return NextResponse.json(getCandidatesResponse());
  } catch {
    return NextResponse.json({
      demo: true,
      source: "demo",
      message: "Demo data shown. Run backend locally to generate real ranked results.",
      candidates: demoCandidates
    });
  }
}
