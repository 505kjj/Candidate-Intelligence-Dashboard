import { NextResponse } from "next/server";
import { getShortlistStatus } from "@/lib/candidates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getShortlistStatus());
}
