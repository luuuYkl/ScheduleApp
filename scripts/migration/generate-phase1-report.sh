#!/usr/bin/env bash
set -euo pipefail

out_file="docs/migration/reports/PHASE1_STATUS_REPORT.md"
android_file="docs/migration/backlog/ANDROID_PHASE1_TASKS.md"
harmony_file="docs/migration/backlog/HARMONY_NEXT_PHASE1_TASKS.md"

count_done() {
  local f="$1"
  (rg -n "^- \[x\]" "$f" || true) | wc -l | tr -d ' '
}

count_todo() {
  local f="$1"
  (rg -n "^- \[ \]" "$f" || true) | wc -l | tr -d ' '
}

ad_done=$(count_done "$android_file")
ad_todo=$(count_todo "$android_file")
ho_done=$(count_done "$harmony_file")
ho_todo=$(count_todo "$harmony_file")

cat > "$out_file" <<REPORT
# Phase 1 状态报告

生成时间：$(date '+%Y-%m-%d %H:%M:%S')

## Android
- 已完成：$ad_done
- 待完成：$ad_todo

## Harmony NEXT
- 已完成：$ho_done
- 待完成：$ho_todo

## 说明
- 数据来源：
  - $android_file
  - $harmony_file
REPORT

echo "[OK] generated $out_file"
