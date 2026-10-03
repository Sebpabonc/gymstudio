#!/bin/zsh
export PATH="$HOME/.local/bin:$PATH"
export GIT_PAGER=cat PAGER=cat
# Live view of Copilot's work: assigned issues, its open PRs, its agent job and CI.
REPO=Sebpabonc/gymstudio
while true; do
  clear
  echo "=== COPILOT (Developer) — $(date '+%a %H:%M:%S') ==="
  echo "\nIssues assigned to Copilot:"
  gh issue list -R $REPO --state open --json number,title,assignees \
    --jq '.[] | select(any(.assignees[]; .login == "Copilot")) | "  #\(.number)  \(.title)"'
  echo "\nCopilot pull requests:"
  gh pr list -R $REPO --state open --author "app/copilot-swe-agent" --json number,title,isDraft,headRefName \
    --jq '.[] | "  #\(.number)  \(if .isDraft then "[draft] " else "" end)\(.title)"'
  for b in $(gh pr list -R $REPO --state open --author "app/copilot-swe-agent" --json headRefName --jq '.[].headRefName'); do
    echo "\n  Jobs on $b:"
    gh run list -R $REPO --branch "$b" -L 4 --json name,status,conclusion,updatedAt \
      --jq '.[] | "    \(.updatedAt[11:16])  \(.name)  →  \(.status) \(.conclusion // "")"'
  done
  sleep 30
done
