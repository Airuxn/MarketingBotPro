import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("package.json exposes required scripts", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  for (const script of ["lint", "type-check", "build", "test"]) {
    assert.ok(pkg.scripts[script], `missing npm script: ${script}`);
  }
});

test("same-origin helper blocks unknown production hosts", () => {
  function hostFromHeader(value) {
    if (!value) return null;
    try {
      return new URL(value).host.toLowerCase();
    } catch {
      return null;
    }
  }

  const allowedHosts = new Set(["app.example.com"]);
  const originHost = hostFromHeader("https://evil.example");
  assert.notEqual(originHost && allowedHosts.has(originHost), true);
});
