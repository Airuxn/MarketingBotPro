import assert from "node:assert/strict";
import test from "node:test";

test("validatePublicHttpUrl rejects internal URLs", async () => {
  const { validatePublicHttpUrl } = await import("../lib/api-security.ts");
  assert.throws(() => validatePublicHttpUrl("http://localhost"));
  assert.throws(() => validatePublicHttpUrl("http://127.0.0.1"));
  assert.throws(() => validatePublicHttpUrl("http://192.168.1.1"));
  assert.throws(() => validatePublicHttpUrl("file:///etc/passwd"));
});

test("validatePublicHttpUrl accepts public URLs", async () => {
  const { validatePublicHttpUrl } = await import("../lib/api-security.ts");
  const url = validatePublicHttpUrl("https://example.com/path");
  assert.equal(url.hostname, "example.com");
});

test("createOAuthState returns a non-empty string", async () => {
  const { createOAuthState } = await import("../lib/api-security.ts");
  const state = createOAuthState();
  assert.equal(typeof state, "string");
  assert.ok(state.length > 0);
});

test("oauthStateCookieOptions respects environment", async () => {
  const { oauthStateCookieOptions } = await import("../lib/api-security.ts");
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  assert.equal(oauthStateCookieOptions().secure, true);
  process.env.NODE_ENV = "development";
  assert.equal(oauthStateCookieOptions().secure, false);
  process.env.NODE_ENV = original;
});

test("getTranslation returns translated and fallback values", async () => {
  const { getTranslation } = await import("../lib/i18n.ts");
  assert.equal(getTranslation("dashboard", "nl"), "Dashboard");
  assert.equal(getTranslation("nonexistent.key", "nl"), "nonexistent.key");
});
