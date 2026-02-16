# JS Bridge V1 协议规范（Android / Harmony NEXT 通用）

## 1. 目标

为 H5 业务层提供统一的原生能力访问协议，避免 Android 与 Harmony NEXT 各自实现导致接口分裂。

## 2. 设计原则

- **统一调用入口**：H5 只感知一套 API。
- **显式版本化**：协议随版本演进，保持向后兼容。
- **请求可追踪**：所有调用都带 requestId。
- **错误标准化**：统一 code/message/details 结构。

## 3. 通信模型

- H5 -> Native：`invoke(method, params, requestId)`
- Native -> H5：`resolve(requestId, data)` / `reject(requestId, error)`
- 事件推送：`emit(eventName, payload)`

## 4. 标准返回结构

### success

```json
{
  "ok": true,
  "requestId": "uuid",
  "data": {}
}
```

### error

```json
{
  "ok": false,
  "requestId": "uuid",
  "error": {
    "code": "BRIDGE_METHOD_NOT_FOUND",
    "message": "method not found",
    "details": {}
  }
}
```

## 5. 方法清单（V1 最小集）

1. `device.getInfo`
   - 入参：`{}`
   - 返回：`platform, osVersion, appVersion, deviceId(optional)`

2. `app.getVersion`
   - 入参：`{}`
   - 返回：`versionName, versionCode`

3. `storage.secureSet`
   - 入参：`{ key: string, value: string }`
   - 返回：`{ success: true }`

4. `storage.secureGet`
   - 入参：`{ key: string }`
   - 返回：`{ value: string | null }`

5. `notification.scheduleLocal`
   - 入参：`{ id, title, body, triggerAt }`
   - 返回：`{ scheduled: true }`

6. `notification.cancelLocal`
   - 入参：`{ id }`
   - 返回：`{ canceled: true }`

7. `storage.secureRemove`
   - 入参：`{ key: string }`
   - 返回：`{ success: true }`

## 6. 错误码

- `BRIDGE_METHOD_NOT_FOUND`
- `BRIDGE_INVALID_PARAMS`
- `BRIDGE_TIMEOUT`
- `BRIDGE_NOT_SUPPORTED`
- `BRIDGE_PERMISSION_DENIED`
- `BRIDGE_INTERNAL_ERROR`

## 7. 安全要求

- 禁止暴露任意执行入口（如 eval、动态脚本注入）。
- 对所有入参做白名单与类型校验。
- 敏感存储必须加密。
- 输出日志脱敏（token、手机号、邮箱等）。

## 8. 兼容策略

- 通过 `bridge.getCapabilities` 返回可用能力集合。
- H5 按能力降级，确保“缺能力可运行”。

## 9. 验收标准

- Android 与 Harmony NEXT 通过同一份用例测试。
- 所有 V1 方法（含 secureRemove）具备成功/失败/超时三类测试。
- 协议改动必须更新版本号与变更记录。


## 10. 客户端调用超时策略

- Web 侧桥接调用默认超时：`1500ms`。
- 超时返回标准错误码：`BRIDGE_TIMEOUT`。
- 超时错误不应自动降级为本地回退写入（避免掩盖原生性能/稳定性问题）。
- bridge 抛出异常时统一映射为 `BRIDGE_INTERNAL_ERROR`，并保留错误 message 便于排查。
- 超时配置最小值为 `1ms`（无效配置会被归一化）。


## 11. 运行时可观测性

- Web 侧 Bridge 提供运行时指标：总调用数、失败数、回退数、超时数、内部错误数。
- 支持事件观察器接口，用于上报每次调用结果（method / requestId / ok / errorCode / fallback）。
- 建议在 Android / Harmony 壳中接入统一埋点，把 `BRIDGE_TIMEOUT`、`BRIDGE_INTERNAL_ERROR` 作为重点告警项。
