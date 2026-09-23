import { runElectronBuilder } from "./run-electron-builder.mjs";

const electronBuilderArgs = process.argv.slice(2);
if (electronBuilderArgs.length === 0) {
  throw new Error("Usage: package-windows.mjs <electron-builder args...>");
}

const releaseVersion = process.env.PI_GUI_RELEASE_VERSION;
if (releaseVersion) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/.test(releaseVersion)) {
    throw new Error(`Invalid PI_GUI_RELEASE_VERSION: ${releaseVersion}`);
  }
  electronBuilderArgs.push(`-c.extraMetadata.version=${releaseVersion}`);
}

process.exit(await runElectronBuilder(electronBuilderArgs));
