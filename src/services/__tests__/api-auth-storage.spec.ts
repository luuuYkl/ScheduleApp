import { beforeEach, describe, expect, it } from "vitest";
import { login, logout } from "@/services/api";

describe("api auth helper storage migration", () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.ScheduleAppBridge;
  });

  it("stores auth values in namespaced secure storage on login", async () => {
    const user = await login("demoUser", "any");

    expect(user.username).toBe("demoUser");
    expect(localStorage.getItem("auth:token")).toBeTruthy();
    expect(localStorage.getItem("auth:user")).toBeTruthy();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("removes namespaced auth values on logout", async () => {
    await login("demoUser", "any");
    await logout();

    expect(localStorage.getItem("auth:token")).toBeNull();
    expect(localStorage.getItem("auth:user")).toBeNull();
  });
});
