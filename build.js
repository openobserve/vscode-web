const process = require("process");
const child_process = require("child_process");
const fs = require("fs");
const fse = require("fs-extra");
const { version, ignoreExtensions } = require("./package.json");
const path = require("path");

const vscodeVersion = version.split("-")[0];

function error(msg) {
  console.info("\x1b[31merror %s\x1b[0m", msg);
}
function ok(msg) {
  console.info("\x1b[32m%s\x1b[0m", msg);
}
function note(msg) {
  console.info("\x1b[90m%s\x1b[0m", msg);
}
function exec(cmd, opts) {
  console.info("\x1b[36m%s\x1b[0m", cmd);
  return child_process.execSync(cmd, opts);
}

const requiredTools = ["node", "yarn", "git", "python"];
note(`required tools ${JSON.stringify(requiredTools)}`);
for (const tool of requiredTools) {
  try {
    child_process.execSync(`${tool} --version`, { stdio: "ignore" });
  } catch (e) {
    error(`"${tool}" is not available.`);
    process.exit(1);
  }
}
ok("required tools installed");

const node_version_out = child_process.execSync(`node -v`);
const node_version = node_version_out.toString().trim();
if (node_version < "v20.0") {
  error(`Want node > 20. Got "${node_version}"`);
  process.exit(1);
}

if (!fs.existsSync("vscode")) {
  note("cloning vscode");
  exec(
    `git clone --depth 1 https://github.com/openobserve/vscode.git -b ${vscodeVersion}`,
    {
      stdio: "inherit",
    }
  );
} else {
  ok("vscode already installed");
  note("delete vscode folder to clone again");
}

note("changing directory to vscode");
process.chdir("vscode");

if (!fs.existsSync("node_modules")) {
  exec("yarn", {
    stdio: "inherit",
    env: {
      ...process.env,
      ELECTRON_SKIP_BINARY_DOWNLOAD: 1,
      PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: 1,
    },
  });
} else {
  ok("node_modules exists. Skipping yarn");
}

// Use simple workbench
note("copying workbench file");
fs.copyFileSync(
  "../workbench.ts",
  "src/vs/code/browser/workbench/workbench.ts"
);

function deleteDirectory(extension) {
  const extensionPath = path.join(__dirname, 'vscode', 'extensions', extension);
  if (fs.existsSync(extensionPath)) {
      fs.rmdirSync(extensionPath, { recursive: true });
      console.log(`Directory ${extensionPath} has been deleted.`);
  } else {
      console.log(`Directory ${extensionPath} does not exist.`);
  }
}

// Delete extensions
note("deleting extensions");
// Iterate over the list of extensions and delete each one
ignoreExtensions.forEach(extension => {
  deleteDirectory(extension);
});

// Compile
note("starting compile");
exec("yarn gulp vscode-web-min", { stdio: "inherit" });
ok("compile completed");

// Extract compiled files
if (fs.existsSync("../dist")) {
  note("cleaning ../dist");
  fs.rmdirSync("../dist", { recursive: true });
} else {
  ok("../dist did not exist. No need to clean");
}

fs.mkdirSync("../dist");
fse.copySync("../vscode-web", "../dist");
ok("copied ../vscode-web to ../dist");
