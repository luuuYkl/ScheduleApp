#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="${1:-work}"
ANDROID_BRANCH="android-version"
HARMONY_BRANCH="harmony-next-version"

if ! git rev-parse --verify "$BASE_BRANCH" >/dev/null 2>&1; then
  echo "[ERR] Base branch '$BASE_BRANCH' does not exist."
  exit 1
fi

git branch -f "$ANDROID_BRANCH" "$BASE_BRANCH"
git branch -f "$HARMONY_BRANCH" "$BASE_BRANCH"

echo "[OK] Branches aligned to '$BASE_BRANCH':"
echo " - $ANDROID_BRANCH"
echo " - $HARMONY_BRANCH"
