#!/bin/zsh
export PATH="$HOME/.local/bin:$PATH"
export GIT_PAGER=cat PAGER=cat
# Live view of the PT / Fitness Expert's output: drafts, validation, approvals.
cd "$(dirname "$0")/../.."
while true; do
  clear
  echo "=== PT / FITNESS EXPERT — $(date '+%a %H:%M:%S') ==="
  echo "\nDrafts in progress (docs/fitness/drafts):"
  find docs/fitness/drafts -type f ! -name .gitkeep -exec stat -f "  %Sm  %N" -t "%d %b %H:%M" {} \; 2>/dev/null | sort -r | head -15
  [ -z "$(find docs/fitness/drafts -type f ! -name .gitkeep 2>/dev/null)" ] && echo "  (none — PT is idle)"
  echo "\nValidation of approved content:"
  python3 scripts/validate-catalogue.py 2>&1 | tail -1 | sed 's/^/  catalogue: /'
  python3 scripts/validate-blocks.py 2>&1 | tail -1 | sed 's/^/  training blocks: /'
  echo "\nLatest approved fitness content (git):"
  git --no-pager log -6 --date=format:'%d %b %H:%M' --format='  %ad  %s' -- docs/fitness/approved
  sleep 20
done
