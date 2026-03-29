import { appendFile } from "node:fs/promises";
import { EOL } from "node:os";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import semanticRelease from "semantic-release";

const execFile = promisify(execFileCallback);
const targetBranch = process.argv[2];

if (!targetBranch) {
  throw new Error("Expected target branch as the first argument.");
}

const cwd = process.cwd();

const previewEnvironment = {
  ...process.env,
  CI: "true",
  GITHUB_ACTIONS: "true",
  GITHUB_BASE_REF: "",
  GITHUB_EVENT_NAME: "push",
  GITHUB_HEAD_REF: "",
  GITHUB_REF: `refs/heads/${targetBranch}`,
  GITHUB_REF_NAME: targetBranch,
};

const releaseConfiguration = {
  branches: [targetBranch],
  ci: false,
  dryRun: true,
  noCi: true,
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
      },
    ],
  ],
  repositoryUrl: cwd,
};

const formatCommit = (commit) => `- \`${commit.commit.short}\` ${commit.subject}`;

const buildSummary = ({ commits, lastRelease, nextRelease, targetBranchName }) => {
  const recentCommits = commits.slice(0, 10);
  const hasRelease = Boolean(nextRelease);
  const headline = hasRelease
    ? `If \`${targetBranchName}\` were published now, semantic-release would create \`${nextRelease.gitTag}\` as a \`${nextRelease.type}\` release.`
    : `If \`${targetBranchName}\` were published now, semantic-release would not create a new release.`;

  return [
    "## Release Preview",
    "",
    headline,
    "",
    `- Target branch: \`${targetBranchName}\``,
    `- Last release: \`${lastRelease?.gitTag ?? "none"}\``,
    `- Commits analyzed: \`${commits.length}\``,
    `- Next release: \`${nextRelease?.gitTag ?? "none"}\``,
    `- Release type: \`${nextRelease?.type ?? "none"}\``,
    "",
    "### Commits Driving This Preview",
    "",
    ...(recentCommits.length > 0 ? recentCommits.map(formatCommit) : ["- No commits since the last release."]),
  ].join(EOL);
};

const writeGitHubOutput = async (outputPath, outputs) => {
  if (!outputPath) {
    return;
  }

  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}`);
  await appendFile(outputPath, `${lines.join(EOL)}${EOL}`);
};

const writePreviewArtifact = async (outputPath, payload) => {
  if (!outputPath) {
    return;
  }

  await appendFile(outputPath, `${JSON.stringify(payload, null, 2)}${EOL}`);
};

const getLatestMergedTag = async () => {
  try {
    const { stdout } = await execFile("git", ["tag", "--merged", "HEAD", "--sort=-v:refname"], { cwd });
    return stdout
      .split(/\r?\n/u)
      .map((tag) => tag.trim())
      .find(Boolean);
  } catch {
    return undefined;
  }
};

try {
  const result = await semanticRelease(releaseConfiguration, {
    cwd,
    env: previewEnvironment,
  });

  const latestMergedTag = await getLatestMergedTag();

  const payload =
    result === false
      ? {
          commits: [],
          hasRelease: false,
          lastRelease: {
            gitTag: latestMergedTag ?? "",
            version: "",
          },
          nextRelease: null,
          targetBranch,
        }
      : {
          commits: result.commits.map((commit) => ({
            shortHash: commit.commit.short,
            subject: commit.subject,
          })),
          hasRelease: true,
          lastRelease: {
            gitTag: result.lastRelease.gitTag ?? "",
            version: result.lastRelease.version ?? "",
          },
          nextRelease: {
            gitTag: result.nextRelease.gitTag,
            type: result.nextRelease.type,
            version: result.nextRelease.version,
          },
          targetBranch,
        };

  const summary = buildSummary({
    commits:
      result === false
        ? []
        : result.commits.map((commit) => ({
            commit: { short: commit.commit.short },
            subject: commit.subject,
          })),
    lastRelease: payload.lastRelease,
    nextRelease: result === false ? null : result.nextRelease,
    targetBranchName: targetBranch,
  });

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}${EOL}`);
  }

  await writeGitHubOutput(process.env.GITHUB_OUTPUT, {
    has_release: String(payload.hasRelease),
    last_release: payload.lastRelease.gitTag || "none",
    next_release: payload.nextRelease?.gitTag ?? "none",
    release_type: payload.nextRelease?.type ?? "none",
    target_branch: payload.targetBranch,
  });

  await writePreviewArtifact(process.env.RELEASE_PREVIEW_OUTPUT_PATH, payload);

  if (payload.hasRelease) {
    console.log(
      `::notice title=Release Preview::${payload.targetBranch} would publish ${payload.nextRelease.gitTag} (${payload.nextRelease.type}).`
    );
  } else {
    console.log(`::notice title=Release Preview::${payload.targetBranch} would not publish a new release.`);
  }
} catch (error) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      `## Release Preview${EOL}${EOL}Preview failed: \`${error.message}\`${EOL}`
    );
  }

  throw error;
}
