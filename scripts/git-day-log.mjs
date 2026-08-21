import { execFileSync, spawnSync } from "node:child_process";

const date = process.argv[2];

if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error("Usage: node git-day-log.mjs YYYY-MM-DD");
  process.exit(1);
}

const nextDay = new Date(`${date}T00:00:00Z`);
nextDay.setUTCDate(nextDay.getUTCDate() + 1);

const until = nextDay.toISOString().slice(0, 10);

const output = execFileSync(
  "git",
  [
    "log",
    "--all",
    "--reverse",
    `--since=${date} 00:00:00`,
    `--until=${until} 00:00:00`,
    "--pretty=format:%h %s",
  ],
  {
    encoding: "utf8",
  },
).trim();

if (!output) {
  console.log(`No commits found on ${date}.`);
  process.exit(0);
}

console.log(output);
