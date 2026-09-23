import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDebianVersion } from "./normalize-debian-version.mjs";

function normalize(version) {
  return normalizeDebianVersion(version);
}

test("normalizes Debian prerelease versions without expanding HOME", () => {
  assert.equal(normalize("0.1.0-beta.33"), "0.1.0~beta.33");
});

test("leaves stable Debian versions unchanged", () => {
  assert.equal(normalize("1.2.3"), "1.2.3");
});
