#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "docs/ANDROID_HARMONY_NEXT_MIGRATION_PLAN.md"
  "docs/migration/EXECUTION_BASELINE.md"
  "docs/migration/bridge/JS_BRIDGE_V1_SPEC.md"
  "docs/migration/ANDROID_IMPLEMENTATION_GUIDE.md"
  "docs/migration/HARMONY_NEXT_IMPLEMENTATION_GUIDE.md"
  "docs/migration/testing/CROSS_PLATFORM_ACCEPTANCE.md"
  "mobile/android/EXECUTION_CHECKLIST.md"
  "mobile/harmony-next/EXECUTION_CHECKLIST.md"
  "mobile/common/BRIDGE_METHODS.md"
  "mobile/common/contracts/bridge-v1.contract.json"
  "mobile/android/config/env.sample.json"
  "mobile/harmony-next/config/env.sample.json"
  "docs/migration/decisions/ADR-001-bridge-versioning.md"
  "docs/migration/backlog/ANDROID_PHASE1_TASKS.md"
  "docs/migration/backlog/HARMONY_NEXT_PHASE1_TASKS.md"
  "mobile/android/bridge/IMPLEMENTATION_NOTES.md"
  "mobile/harmony-next/bridge/IMPLEMENTATION_NOTES.md"
  "docs/migration/reports/PHASE1_STATUS_REPORT.md"
  "src/services/bridge.ts"
  "src/services/secure-storage.ts"
  "src/services/__tests__/bridge.spec.ts"
  "src/services/__tests__/secure-storage.spec.ts"
  "src/services/__tests__/api-auth-storage.spec.ts"
  "scripts/migration/validate-runtime-auth-path.sh"
)

missing=0
for f in "${required_files[@]}"; do
  if [[ -f "$f" ]]; then
    echo "[OK] $f"
  else
    echo "[MISS] $f"
    missing=1
  fi
done

if git show-ref --verify --quiet refs/heads/android-version; then
  echo "[OK] branch android-version"
else
  echo "[MISS] branch android-version"
  missing=1
fi

if git show-ref --verify --quiet refs/heads/harmony-next-version; then
  echo "[OK] branch harmony-next-version"
else
  echo "[MISS] branch harmony-next-version"
  missing=1
fi

if [[ "$missing" -ne 0 ]]; then
  echo "[ERR] migration baseline verification failed"
  exit 1
fi

echo "[OK] migration baseline verification passed"
