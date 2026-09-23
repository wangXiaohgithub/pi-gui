import { pathToFileURL } from "node:url";

export function normalizeDebianVersion(version) {
  return version.replaceAll("-", "~");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const version = process.argv[2];
  if (!version || process.argv.length !== 3) {
    console.error("Usage: normalize-debian-version.mjs <version>");
    process.exitCode = 2;
  } else {
    console.log(normalizeDebianVersion(version));
  }
}
