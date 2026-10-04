#!/bin/bash
# GymStudio team board: the end-to-end workflow with each agent as a box and its live work.
# Usage: scripts/watch/board.sh          (one snapshot)
#        scripts/watch/board.sh --watch  (refresh every 60 s)
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
export GH_PAGER=cat
export LC_ALL=en_US.UTF-8
REPO=Sebpabonc/gymstudio
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
W=84

B=$'\e[1m'; D=$'\e[2m'; R=$'\e[0m'; G=$'\e[32m'; Y=$'\e[33m'; C=$'\e[36m'; M=$'\e[35m'; RED=$'\e[31m'

line() { printf '%*s' "$1" '' | sed 's/ /─/g'; }
# box "<colour>" "<title>" line...
box() {
  local colour=$1 title=$2; shift 2
  local tlen=${#title}
  printf '%s┌─ %s%s%s %s┐%s\n' "$colour" "$B" "$title" "$R$colour" "$(line $((W - tlen - 5)))" "$R"
  if [ $# -eq 0 ]; then set -- "${D}(nothing right now)${R}"; fi
  for l in "$@"; do
    local plain; plain=$(printf '%s' "$l" | sed $'s/\e\\[[0-9;]*m//g')
    if [ ${#plain} -gt $((W - 4)) ]; then l="${plain:0:$((W - 7))}..."; plain=$l; fi
    printf '%s│%s %s%*s %s│%s\n' "$colour" "$R" "$l" $((W - 4 - ${#plain})) '' "$colour" "$R"
  done
  printf '%s└%s┘%s\n' "$colour" "$(line $((W - 2)))" "$R"
}
arrow() { printf '%*s%s▼ %s%s\n' $((W / 2 - 2)) '' "$D" "$1" "$R"; }

snapshot() {
  git -C "$ROOT" fetch -q origin main 2>/dev/null
  local files; files=$(git -C "$ROOT" ls-tree -r --name-only origin/main)

  # Data from GitHub.
  local issues prs runs merged deploy
  issues=$(gh issue list -R $REPO --state open --limit 100 --json number,title,assignees,labels \
    -q '.[] | "\(.number)|\([.assignees[].login]|join(","))|\([.labels[].name]|join(","))|\(.title|gsub("[|]";"/"))"')
  prs=$(gh pr list -R $REPO --state open --limit 50 --json number,title,isDraft,headRefName,statusCheckRollup \
    -q '.[] | "\(.number)|\(.isDraft)|\(.headRefName)|\([.statusCheckRollup[]? | select(.name=="verify") | (.conclusion // .status)] | first // "waiting")|\(.title|gsub("[|]";"/"))"')
  runs=$(gh run list -R $REPO --limit 60 --json name,status,headBranch \
    -q '.[] | select(.name|test("Copilot|Addressing")) | select(.status!="completed") | .headBranch')
  merged=$(gh pr list -R $REPO --state merged --limit 6 --json number,title,mergedAt \
    -q '.[] | "#\(.number) \(.mergedAt[5:16]|sub("T";" "))Z \(.title)"')
  deploy=$(gh run list -R $REPO --workflow "Deploy to GitHub Pages" --limit 1 --json status,conclusion,createdAt \
    -q '.[0] | "\(.status) \(.conclusion // "") \(.createdAt[5:16]|sub("T";" "))"')

  clear 2>/dev/null
  printf '%sGymStudio team board%s  %s%s  ·  refreshed %s%s\n\n' "$B" "$R" "$D" "$REPO" "$(date '+%d %b %H:%M')" "$R"

  # 1. Product Owner
  local ux_pending pt_drafts po_lines=()
  ux_pending=$(echo "$files" | grep '^docs/ux/proposals/.*\.md$' | sed 's#docs/ux/proposals/##')
  pt_drafts=$(echo "$files" | grep '^docs/fitness/drafts/' | grep -v '\.gitkeep' | sed 's#docs/fitness/drafts/##')
  while read -r f; do [ -n "$f" ] && po_lines+=("${Y}decide${R} UX proposal: $f"); done <<< "$ux_pending"
  while read -r f; do [ -n "$f" ] && po_lines+=("${Y}approve${R} PT draft: $f"); done <<< "$pt_drafts"
  po_lines+=("${D}Gives requirements & decisions · accepts results on the live app${R}")
  box "$M" "1. PRODUCT OWNER · Sebas" "${po_lines[@]}"
  arrow "requirement / decision"

  # 2. Specialist agents (proposals, content, QA)
  local qa_open qa_report ux_lines=() qa_lines=()
  ux_lines+=("Proposals waiting for PO: $(echo "$ux_pending" | grep -c .)  ·  approved: $(echo "$files" | grep -c '^docs/ux/approved/.*\.md$')")
  box "$C" "2a. UXer · UX & AI proposals  (docs/ux/)" "${ux_lines[@]}"
  box "$C" "2b. PT · fitness content  (docs/fitness/)" \
    "Drafts: $(echo "$pt_drafts" | grep -c .)  ·  approved files: $(echo "$files" | grep -c '^docs/fitness/approved/')"
  qa_report=$(git -C "$ROOT" log origin/main -1 --format= --name-only -- docs/qa/reports | head -1 | sed 's#docs/qa/reports/##')
  qa_open=$(echo "$issues" | awk -F'|' '$3 ~ /(^|,)qa(,|$)/' )
  qa_lines+=("Latest report: ${qa_report:-none}  ·  open QA issues: $(echo "$qa_open" | grep -c .)")
  while IFS='|' read -r n a l t; do [ -n "$n" ] && qa_lines+=("#$n $t"); done <<< "$(echo "$qa_open" | head -5)"
  box "$C" "2c. QAer · tests the live app  (docs/qa/)" "${qa_lines[@]}"
  arrow "findings & approved designs"

  # 3. Tech Lead
  local tl_lines=() backlog review
  backlog=$(echo "$issues" | awk -F'|' '$2 == ""')
  review=$(echo "$prs" | while IFS='|' read -r n d b ci t; do
    if ! echo "$runs" | grep -qx "$b"; then echo "#$n [CI $ci] $t"; fi; done)
  tl_lines+=("${B}Ready to review/merge:${R}")
  if [ -n "$review" ]; then while read -r l; do tl_lines+=("  $l"); done <<< "$review"; else tl_lines+=("  ${D}none${R}"); fi
  tl_lines+=("${B}Backlog (not yet assigned):${R} $(echo "$backlog" | grep -c .) issues")
  while IFS='|' read -r n a l t; do [ -n "$n" ] && tl_lines+=("  #$n $t"); done <<< "$(echo "$backlog" | head -6)"
  box "$G" "3. TECH LEAD · Claude  (design, issues, review, merge)" "${tl_lines[@]}"
  arrow "GitHub issue assigned to @copilot"

  # 4. Copilot
  local cp_lines=() assigned
  assigned=$(echo "$issues" | awk -F'|' '$2 ~ /[Cc]opilot/')
  while IFS='|' read -r n a l t; do [ -n "$n" ] && cp_lines+=("issue #$n $t"); done <<< "$assigned"
  while IFS='|' read -r n d b ci t; do
    [ -n "$n" ] && echo "$runs" | grep -qx "$b" && cp_lines+=("${Y}working${R} PR #$n $t")
  done <<< "$prs"
  box "$Y" "4. COPILOT · developer  (branches copilot/*)" "${cp_lines[@]}"
  arrow "pull request → CI verify → Tech Lead review → squash merge"

  # 5. main + live
  local live_lines=()
  while read -r l; do [ -n "$l" ] && live_lines+=("$l"); done <<< "$merged"
  case "$deploy" in completed\ success*) live_lines+=("${G}Deploy OK${R} ${deploy#completed success }");;
    *) live_lines+=("${RED}Deploy: $deploy${R}");; esac
  live_lines+=("Live: https://sebpabonc.github.io/gymstudio/")
  box "$G" "5. MAIN BRANCH → GITHUB PAGES (live app)" "${live_lines[@]}"
  arrow "Sebas accepts · QAer re-checks"
}

if [ "$1" = "--watch" ]; then
  while true; do snapshot; sleep 60; done
else
  snapshot
fi
