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

test("getOAuthUrls builds correct OAuth URLs", async () => {
  const { getOAuthUrls } = await import("../lib/vercel-url.ts");
  const request = new Request("https://example.com/api/oauth");
  const urls = getOAuthUrls(request, "/callback");
  assert.equal(urls.baseUrl, "https://example.com");
  assert.equal(urls.redirectUri, "https://example.com/callback");
  assert.equal(urls.isVercel, false);
  assert.equal(urls.isProduction, false);
});

test("calculateAspectRatio reduces ratios", async () => {
  const { calculateAspectRatio } = await import("../lib/platform-specs.ts");
  assert.equal(calculateAspectRatio(1920, 1080), "16:9");
  assert.equal(calculateAspectRatio(1080, 1080), "1:1");
});

test("checkAspectRatio validates allowed ratios", async () => {
  const { checkAspectRatio } = await import("../lib/platform-specs.ts");
  assert.equal(checkAspectRatio(1200, 675, "twitter", "image"), true);
  assert.equal(checkAspectRatio(100, 100, "unknown", "image"), false);
  assert.equal(checkAspectRatio(100, 100, "twitter", "image"), true);
  assert.equal(checkAspectRatio(100, 200, "twitter", "image"), false);
});

test("validateMedia accepts valid formats and rejects invalid ones", async () => {
  const { validateMedia } = await import("../lib/platform-specs.ts");
  const valid = { name: "test.jpg", size: 1024, type: "image/jpeg" };
  const invalid = { name: "test.bmp", size: 1024, type: "image/bmp" };
  const tooLarge = { name: "test.jpg", size: 10 * 1024 * 1024, type: "image/jpeg" };
  assert.equal(validateMedia(valid, "twitter", "image").valid, true);
  assert.equal(validateMedia(invalid, "twitter", "image").valid, false);
  assert.equal(validateMedia(tooLarge, "twitter", "image").valid, false);
  assert.equal(validateMedia(valid, "unknown", "image").valid, false);
});

test("isSameOriginApiRequest allows non-production and validates origin in production", async () => {
  const { isSameOriginApiRequest } = await import("../lib/api-origin.ts");
  const original = process.env.NODE_ENV;

  function mockNextRequest(url, origin) {
    return {
      nextUrl: new URL(url),
      headers: { get: (name) => (name === "origin" ? origin : null) },
    };
  }

  process.env.NODE_ENV = "development";
  assert.equal(isSameOriginApiRequest(mockNextRequest("https://example.com", "https://evil.com")), true);

  process.env.NODE_ENV = "production";
  process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
  assert.equal(isSameOriginApiRequest(mockNextRequest("https://example.com", "https://example.com")), true);
  assert.equal(isSameOriginApiRequest(mockNextRequest("https://example.com", "https://evil.com")), false);

  process.env.NODE_ENV = original;
  delete process.env.NEXT_PUBLIC_APP_URL;
});
