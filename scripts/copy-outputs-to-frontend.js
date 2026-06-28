const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const generatedDir = path.join(projectRoot, "frontend", "public", "generated");

const files = [
  {
    source: path.join(projectRoot, "outputs", "submission.csv"),
    target: path.join(generatedDir, "submission.csv")
  },
  {
    source: path.join(projectRoot, "outputs", "top_candidates.json"),
    target: path.join(generatedDir, "top_candidates.json")
  }
];

fs.mkdirSync(generatedDir, { recursive: true });

for (const file of files) {
  if (!fs.existsSync(file.source)) {
    console.error(`Missing ${path.relative(projectRoot, file.source)}. Run backend ranking before copying outputs.`);
    process.exitCode = 1;
    continue;
  }

  fs.copyFileSync(file.source, file.target);
  const stats = fs.statSync(file.target);
  console.log(`Copied ${path.relative(projectRoot, file.source)} -> ${path.relative(projectRoot, file.target)} (${stats.size} bytes)`);
}

if (!process.exitCode) {
  console.log("Generated frontend output files are ready for Vercel.");
}
