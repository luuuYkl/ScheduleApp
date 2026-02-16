import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearBridgeCapabilityCache,
  getBridgeCapabilities,
  isBridgeMethodSupported,
  getBridgeRuntimeMetrics,
  refreshBridgeCapabilities,
  resetBridgeRuntimeMetrics,
  secureGet,
  secureRemove,
  secureSet,
  setBridgeEventObserver,
  setBridgeTimeoutMs,
} from '@/services/bridge';

describe('bridge service', () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.ScheduleAppBridge;
    clearBridgeCapabilityCache();
    setBridgeTimeoutMs(1500);
    resetBridgeRuntimeMetrics();
    setBridgeEventObserver(null);
  });

  it('falls back to localStorage for secureSet/secureGet when native bridge is unavailable', async () => {
    const setResult = await secureSet('token', 'abc');
    expect(setResult.ok).toBe(true);

    const getResult = await secureGet('token');
    expect(getResult.ok).toBe(true);
    if (getResult.ok) {
      expect(getResult.data.value).toBe('abc');
    }
  });

  it('removes storage value through fallback when native bridge is unavailable', async () => {
    await secureSet('token', 'abc');
    const removeResult = await secureRemove('token');
    expect(removeResult.ok).toBe(true);

    const getResult = await secureGet('token');
    expect(getResult.ok).toBe(true);
    if (getResult.ok) {
      expect(getResult.data.value).toBeNull();
    }
  });

  it('uses native bridge when available', async () => {
    const invoke = vi.fn().mockResolvedValue({
      ok: true,
      requestId: 'native-1',
      data: { value: 'from-native' },
    });

    window.ScheduleAppBridge = { invoke };

    const result = await secureGet('token');
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.value).toBe('from-native');
    }
  });

  it('does not fallback when native method returns permission denied', async () => {
    const invoke = vi.fn().mockResolvedValue({
      ok: false,
      requestId: 'native-2',
      error: {
        code: 'BRIDGE_PERMISSION_DENIED',
        message: 'denied',
      },
    });

    window.ScheduleAppBridge = { invoke };

    const result = await secureSet('token', 'abc');
    expect(result.ok).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('refreshes and reads bridge capabilities cache', async () => {
    const invoke = vi.fn().mockResolvedValue({
      ok: true,
      requestId: 'native-3',
      data: ['storage.secureSet', 'storage.secureGet'],
    });

    window.ScheduleAppBridge = { invoke };

    const refresh = await refreshBridgeCapabilities();
    expect(refresh.ok).toBe(true);

    const supported = await isBridgeMethodSupported('storage.secureGet');
    const unsupported = await isBridgeMethodSupported('notification.scheduleLocal');

    expect(supported).toBe(true);
    expect(unsupported).toBe(false);
  });



  it('returns timeout error when native bridge does not respond in time', async () => {
    setBridgeTimeoutMs(1);
    window.ScheduleAppBridge = {
      invoke: () => new Promise(() => {}),
    };

    const result = await secureGet('token');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('BRIDGE_TIMEOUT');
    }
    expect(localStorage.getItem('token')).toBeNull();
  });



  it('returns internal error when native invoke throws', async () => {
    window.ScheduleAppBridge = {
      invoke: () => Promise.reject(new Error('native crash')),
    };

    const result = await secureGet('token');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('BRIDGE_INTERNAL_ERROR');
      expect(result.error.message).toContain('native crash');
    }
  });

  it('normalizes timeout value to at least 1ms', async () => {
    setBridgeTimeoutMs(0);
    window.ScheduleAppBridge = {
      invoke: () => new Promise(() => {}),
    };

    const result = await secureGet('token');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('BRIDGE_TIMEOUT');
    }
  });



  it('tracks runtime metrics for fallback and timeout paths', async () => {
    await secureSet('token', 'abc');

    setBridgeTimeoutMs(1);
    window.ScheduleAppBridge = {
      invoke: () => new Promise(() => {}),
    };
    await secureGet('token');

    const metrics = getBridgeRuntimeMetrics();
    expect(metrics.totalCalls).toBeGreaterThanOrEqual(3);
    expect(metrics.fallbackCalls).toBeGreaterThanOrEqual(1);
    expect(metrics.timeoutCalls).toBeGreaterThanOrEqual(1);
  });

  it('emits bridge call events to observer', async () => {
    const events: string[] = [];
    setBridgeEventObserver((event) => {
      events.push(`${event.method}:${event.ok ? 'ok' : 'fail'}:${event.usedFallback ? 'fb' : 'native'}`);
    });

    await secureSet('token', 'abc');

    expect(events.some((e) => e.startsWith('storage.secureSet:fail:native'))).toBe(true);
    expect(events.some((e) => e.startsWith('storage.secureSet:ok:fb'))).toBe(true);
  });

  it('returns not supported for capabilities when native bridge is unavailable', async () => {
    const result = await getBridgeCapabilities();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('BRIDGE_NOT_SUPPORTED');
    }
  });
});
