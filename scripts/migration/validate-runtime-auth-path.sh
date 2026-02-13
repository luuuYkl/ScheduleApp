#!/usr/bin/env bash
set -euo pipefail

# 允许出现 legacy token/user 本地存储访问的文件（迁移兼容与测试）
allowlist=(
  "src/services/secure-storage.ts"
  "src/services/__tests__/secure-storage.spec.ts"
  "src/services/__tests__/api-auth-storage.spec.ts"
  "src/services/__tests__/bridge.spec.ts"
)

# 扫描 src 下是否仍有直接访问 token/user localStorage 的运行时代码
matches=$(rg -n "localStorage\.(getItem|setItem|removeItem)\(\s*['\"](token|user)['\"]\s*\)" src || true)

if [[ -z "$matches" ]]; then
  echo "[OK] no legacy token/user localStorage access detected"
  exit 0
fi

status=0
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  file=${line%%:*}
  allowed=false
  for a in "${allowlist[@]}"; do
    if [[ "$file" == "$a" ]]; then
      allowed=true
      break
    fi
  done

  if [[ "$allowed" == false ]]; then
    echo "[ERR] forbidden legacy auth storage access: $line"
    status=1
  else
    echo "[OK] allowed legacy access (compat/test): $line"
  fi
done <<< "$matches"

if [[ $status -ne 0 ]]; then
  echo "[ERR] runtime auth path validation failed"
  exit 1
fi

echo "[OK] runtime auth path validation passed"
