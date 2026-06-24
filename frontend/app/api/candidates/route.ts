import { NextResponse } from "next/server";
import { getCandidatesResponse } from "@/lib/candidates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getCandidatesResponse());
}
