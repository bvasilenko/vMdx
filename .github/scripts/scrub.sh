#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 bvasilenko

set -uo pipefail

TARGET="${1:-.}"

PATTERNS=(
  "alexy-os"
  "delta5-hq"
  "quant5-lab"
  "ui8kit"
  "buildy-ui"
  "ui\\.buildy\\.tw"
  "hinddy/tailwind-builder"
  "ruvnet/ruflo"
  "TauricResearch/TradingAgents"
  "/tmp/donors/"
  "@buildy/"
  "@editory/"
)

EXCLUDES=(
  ":(exclude)node_modules/**"
  ":(exclude)dist/**"
  ":(exclude)build/**"
  ":(exclude).next/**"
  ":(exclude)coverage/**"
  ":(exclude)*.lock"
  ":(exclude)bun.lockb"
  ":(exclude)package-lock.json"
  ":(exclude)pnpm-lock.yaml"
  ":(exclude)yarn.lock"
  ":(exclude).github/**"
)

cd "$TARGET" || { echo "scrub: target $TARGET not found" >&2; exit 2; }

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  FILES=$(git ls-files -- . "${EXCLUDES[@]}" 2>/dev/null)
else
  FILES=$(find . -type f \
    -not -path '*/node_modules/*' \
    -not -path '*/dist/*' \
    -not -path '*/build/*' \
    -not -path '*/.next/*' \
    -not -path '*/coverage/*' \
    -not -name '*.lock' \
    -not -name 'bun.lockb' \
    -not -name 'package-lock.json' \
    -not -name 'pnpm-lock.yaml' \
    -not -name 'yarn.lock')
fi

if [ -z "${FILES:-}" ]; then
  echo "scrub: no files to scan in $TARGET"
  exit 0
fi

LEAKED=0
echo "scrub: scanning $(echo "$FILES" | wc -l | tr -d ' ') files for ${#PATTERNS[@]} forbidden patterns..."

for pat in "${PATTERNS[@]}"; do
  HITS=$(echo "$FILES" | xargs -d '\n' -I{} grep -inHE "$pat" {} 2>/dev/null || true)
  if [ -n "$HITS" ]; then
    echo
    echo "SCRUB LEAK: pattern '$pat' found:"
    echo "$HITS" | head -20
    HIT_COUNT=$(echo "$HITS" | wc -l)
    if [ "$HIT_COUNT" -gt 20 ]; then
      echo "  ... ($((HIT_COUNT - 20)) more suppressed)"
    fi
    LEAKED=$((LEAKED + 1))
  fi
done

if [ "$LEAKED" -gt 0 ]; then
  echo
  echo "scrub: FAILED — $LEAKED forbidden pattern(s) found"
  exit 1
fi

echo "scrub: OK — no forbidden patterns found"
exit 0
