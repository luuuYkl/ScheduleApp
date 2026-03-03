import { beforeEach, describe, expect, it } from "vitest";
import {
  getSecureAuthJson,
  getSecureAuthValue,
  migrateLegacyAuthStorageIfNeeded,
  removeSecureAuthValue,
  setSecureAuthJson,
  setSecureAuthValue,
} from "@/services/secure-storage";

describe("secure storage service", () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.ScheduleAppBridge;
  });

  it("stores auth value with namespaced key", async () => {
    await setSecureAuthValue("token", "abc");

    expect(localStorage.getItem("auth:token")).toBe("abc");

    const value = await getSecureAuthValue("token");
    expect(value.ok).toBe(true);
    if (value.ok) expect(value.data.value).toBe("abc");
  });

  it("stores and reads auth json safely", async () => {
    await setSecureAuthJson("user", { id: 1, username: "demo" });

    const user = await getSecureAuthJson<{ id: number; username: string }>(
      "user",
    );
    expect(user).toEqual({ id: 1, username: "demo" });
  });

  it("returns null for invalid json", async () => {
    localStorage.setItem("auth:user", "{invalid-json}");

    const user = await getSecureAuthJson<{ id: number }>("user");
    expect(user).toBeNull();
  });

  it("migrates legacy auth keys into namespaced keys", async () => {
    localStorage.setItem("token", "legacy-token");
    localStorage.setItem("user", JSON.stringify({ id: 1 }));

    await migrateLegacyAuthStorageIfNeeded();

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("auth:token")).toBe("legacy-token");
    expect(localStorage.getItem("auth:user")).toBe(JSON.stringify({ id: 1 }));
  });

  it("removes auth value", async () => {
    await setSecureAuthValue("token", "abc");
    await removeSecureAuthValue("token");

    expect(localStorage.getItem("auth:token")).toBeNull();
  });
});
