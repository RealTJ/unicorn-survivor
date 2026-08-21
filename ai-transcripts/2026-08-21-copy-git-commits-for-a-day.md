## Me
In git how can I copy the revision numbers and commit messages from a single day? This can be a mjs script

## AI Assistant
You can use `git log` with a date range. This `.mjs` script copies each commit’s short revision number and commit message for a given day to the system clipboard.

Save as `git-day-log.mjs`:

```javascript
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

const platform = process.platform;

if (platform === "darwin") {
  spawnSync("pbcopy", { input: output });
  console.log("\nCopied to the clipboard.");
} else if (platform === "win32") {
  spawnSync("clip", { input: output, shell: true });
  console.log("\nCopied to the clipboard.");
} else if (platform === "linux") {
  const result = spawnSync("xclip", ["-selection", "clipboard"], {
    input: output,
  });

  if (result.status === 0) {
    console.log("\nCopied to the clipboard.");
  } else {
    console.log(
      "\nInstall xclip to copy automatically, or copy the output above.",
    );
  }
}
```


Run it with:

```shell script
node git-day-log.mjs 2026-08-21
```


Example output:

```plain text
a1b2c3d Add user authentication
e4f5g6h Fix validation error
i7j8k9l Update documentation
```


The `--all` option includes commits from all local branches. Remove it if you only want commits reachable from the current branch.

For full revision numbers instead of short hashes, change:

```javascript
"--pretty=format:%h %s",
```


to:

```javascript
"--pretty=format:%H %s",
```


Git uses the computer’s local timezone when interpreting the date range. To inspect the exact commits directly from the command line:

```shell script
git log --all --reverse --since="2026-08-21 00:00:00" --until="2026-08-22 00:00:00" --pretty=format:"%h %s"
```

