import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";
import { outputPaths, projectRoot } from "@/lib/candidates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

function safeText(value: string | undefined) {
  return (value || "").slice(-6000);
}

export async function POST() {
  if (!fs.existsSync(outputPaths.candidates)) {
    return NextResponse.json(
      {
        success: false,
        message: "data/candidates.jsonl not found. Please place the organiser dataset file inside data/candidates.jsonl."
      },
      { status: 400 }
    );
  }

  const python = process.env.PYTHON || "python";
  const args = [
    "backend/rank.py",
    "--candidates",
    "./data/candidates.jsonl",
    "--out",
    "./outputs/submission.csv",
    "--json",
    "./outputs/top_candidates.json"
  ];

  try {
    const { stdout, stderr } = await execFileAsync(python, args, {
      cwd: projectRoot,
      timeout: 310000,
      maxBuffer: 10 * 1024 * 1024
    });

    return NextResponse.json({
      success: true,
      message: "Shortlist generated successfully.",
      submissionPath: "outputs/submission.csv",
      jsonPath: "outputs/top_candidates.json",
      stdout: safeText(stdout),
      stderr: safeText(stderr)
    });
  } catch (error) {
    const err = error as { message?: string; stdout?: string; stderr?: string; code?: number | string };
    return NextResponse.json(
      {
        success: false,
        message: "Ranking failed. Review the backend output below.",
        code: err.code ?? null,
        error: err.message || "Unknown ranking error",
        stdout: safeText(err.stdout),
        stderr: safeText(err.stderr)
      },
      { status: 500 }
    );
  }
}
