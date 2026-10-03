#!/bin/zsh
export PATH="$HOME/.local/bin:$PATH"
export GIT_PAGER=cat PAGER=cat
# Live view of the Tech Lead's work: merged PRs, reviews, database and deploy.
REPO=Sebpabonc/gymstudio
cd "$(dirname "$0")/../.."
while true; do
  clear
  echo "=== TECH LEAD (Claude) — $(date '+%a %H:%M:%S') ==="
  echo "\nLocal branch: $(git branch --show-current)   uncommitted files: $(git status --porcelain | wc -l | tr -d ' ')"
  echo "\nLast merges to main:"
  gh pr list -R $REPO --state merged -L 6 --json number,title,mergedAt \
    --jq '.[] | "  \(.mergedAt[5:16] | sub("T";" "))  #\(.number)  \(.title)"'
  echo "\nOpen PRs and review state:"
  gh pr list -R $REPO --state open --json number,title,reviewDecision,isDraft \
    --jq '.[] | "  #\(.number)  \(.title)  [\(if .isDraft then "draft" else (.reviewDecision // "awaiting review") end)]"'
  echo "\nLive app deploy:"
  gh run list -R $REPO --branch main --workflow "Deploy to GitHub Pages" -L 1 --json conclusion,status,headSha,updatedAt \
    --jq '.[] | "  \(.updatedAt[5:16] | sub("T";" "))  \(.status) \(.conclusion // "")  (\(.headSha[:7]))"'
  echo "\nDatabase migrations in repo: $(ls supabase/migrations | wc -l | tr -d ' ')  (latest: $(ls supabase/migrations | tail -1))"
  sleep 30
done
