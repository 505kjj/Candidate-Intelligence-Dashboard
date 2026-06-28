import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";
import { isVercelRuntime, outputPaths, projectRoot } from "@/lib/candidates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

function safeText(value: string | undefined) {
  return (value || "").slice(-6000);
}

export async function POST() {
  if (isVercelRuntime()) {
    return NextResponse.json(
      {
        success: false,
        message: "Run Discovery is available locally only. Use bundled generated outputs or demo data on Vercel.",
        submissionPath: "outputs/submission.csv",
        jsonPath: "outputs/top_candidates.json"
      },
      { status: 501 }
    );
  }

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
    fs.mkdirSync(path.dirname(outputPaths.submission), { recursive: true });

    const { stdout, stderr } = await execFileAsync(python, args, {
      cwd: projectRoot,
      timeout: 310000,
      maxBuffer: 10 * 1024 * 1024
    });

    const submissionExists = fs.existsSync(outputPaths.submission);
    const jsonExists = fs.existsSync(outputPaths.topCandidates);

    if (!submissionExists || !jsonExists) {
      return NextResponse.json(
        {
          success: false,
          message: "Ranking finished, but expected output files were not found.",
          submissionPath: "outputs/submission.csv",
          jsonPath: "outputs/top_candidates.json",
          submissionExists,
          jsonExists,
          stdout: safeText(stdout),
          stderr: safeText(stderr)
        },
        { status: 500 }
      );
    }

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
