import { secureGet, secureRemove, secureSet } from '@/services/bridge';

const AUTH_KEY_PREFIX = 'auth:';

function withPrefix(key: string) {
  return `${AUTH_KEY_PREFIX}${key}`;
}

export async function setSecureAuthValue(key: string, value: string) {
  return secureSet(withPrefix(key), value);
}

export async function getSecureAuthValue(key: string) {
  return secureGet(withPrefix(key));
}

export async function removeSecureAuthValue(key: string) {
  return secureRemove(withPrefix(key));
}

export async function setSecureAuthJson<T>(key: string, value: T) {
  return setSecureAuthValue(key, JSON.stringify(value));
}

export async function getSecureAuthJson<T>(key: string): Promise<T | null> {
  const result = await getSecureAuthValue(key);
  if (!result.ok || !result.data.value) return null;

  try {
    return JSON.parse(result.data.value) as T;
  } catch (_error) {
    return null;
  }
}


const LEGACY_KEYS = ['token', 'user'] as const;

export async function migrateLegacyAuthStorageIfNeeded() {
  for (const key of LEGACY_KEYS) {
    const namespacedKey = withPrefix(key);
    const namespacedValue = localStorage.getItem(namespacedKey);
    const legacyValue = localStorage.getItem(key);

    if (!namespacedValue && legacyValue) {
      await setSecureAuthValue(key, legacyValue);
      localStorage.removeItem(key);
    }
  }
}
