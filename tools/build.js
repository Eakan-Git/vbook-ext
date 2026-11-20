// Build every extension folder (one containing plugin.json + src/) into plugin.zip,
// then regenerate the root catalog plugin.json. Usage: node tools/build.js
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const REPO = "Eakan-Git/vbook-ext", RAW = `https://raw.githubusercontent.com/${REPO}/main`;
const data = [];
for (const dir of fs.readdirSync(ROOT).sort()) {
  const d = path.join(ROOT, dir);
  if (!fs.existsSync(path.join(d, "plugin.json")) || !fs.existsSync(path.join(d, "src"))) continue;
  const m = JSON.parse(fs.readFileSync(path.join(d, "plugin.json"), "utf8")).metadata;
  fs.rmSync(path.join(d, "plugin.zip"), { force: true });
  const files = ["plugin.json", "src"].concat(fs.existsSync(path.join(d, "icon.png")) ? ["icon.png"] : []);
  execFileSync("zip", ["-qrX", "plugin.zip", ...files], { cwd: d });
  data.push({
    name: m.name, author: m.author, path: `${RAW}/${dir}/plugin.zip`, version: m.version,
    source: m.source, icon: `${RAW}/${dir}/icon.png`, description: m.description,
    type: m.type, locale: m.locale,
  });
  console.log(`built ${dir} v${m.version}`);
}
const catalog = { metadata: { author: "Eakan", description: "vBook extensions by Eakan" }, data };
fs.writeFileSync(path.join(ROOT, "plugin.json"), JSON.stringify(catalog, null, 2) + "\n");
console.log(`catalog: ${data.length} extension(s)`);
