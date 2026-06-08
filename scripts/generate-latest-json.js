import fs from "fs";
import path from "path";

const config = JSON.parse(fs.readFileSync("src-tauri/tauri.conf.json", "utf-8"));
const version = config.version;

const latest = {
  version: `v${version}`,
  notes: "A new version of Rune is available.",
  pub_date: new Date().toISOString(),
  platforms: {}
};

const bundleDir = path.join("src-tauri", "target", "release", "bundle");

function findSigFile(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const sigFile = files.find(f => f.endsWith(".sig"));
  return sigFile ? path.join(dir, sigFile) : null;
}

function processPlatform(platformKey, searchDirs) {
  for (const dir of searchDirs) {
    const sigPath = findSigFile(dir);
    if (sigPath) {
      const signature = fs.readFileSync(sigPath, "utf-8").trim();
      const binaryName = path.basename(sigPath, ".sig");
      // Use latest/download so GitHub resolves the correct release asset
      const url = `https://github.com/satadeep3927/rune/releases/latest/download/${binaryName}`;
      latest.platforms[platformKey] = { signature, url };
      console.log(`[+] Found ${platformKey} signature: ${binaryName}`);
      return;
    }
  }
  console.log(`[-] No signature found for ${platformKey}`);
}

// Windows
processPlatform("windows-x86_64", [
  path.join(bundleDir, "nsis"),
  path.join(bundleDir, "msi")
]);

// Linux
processPlatform("linux-x86_64", [
  path.join(bundleDir, "linux", "appimage"),
  path.join(bundleDir, "appimage")
]);

fs.writeFileSync("latest.json", JSON.stringify(latest, null, 2));
console.log("\nGenerated latest.json successfully!");
