var fs = require("fs");
const fse = require("fs-extra");
const child_process = require("child_process");

if (fs.existsSync("./o2-vscode-web/static")) {
  fs.rmdirSync("./o2-vscode-web/static", { recursive: true });
}

fse.copySync("./dist/extensions", "./o2-vscode-web/static/extensions");
fse.copySync("./dist/node_modules", "./o2-vscode-web/static/node_modules");
fse.copySync("./dist/out", "./o2-vscode-web/static/out");
fse.copySync("./dist", "./o2-vscode-web", { recursive: true, filter: (src) => !src.includes("extensions") && !src.includes("node_modules") && !src.includes("out") && !src.includes("package.json") });

const webPlaygroundPath = './o2-vscode/static/extensions/openobserve-vscode-playground';

child_process.execSync(`git clone https://github.com/openobserve/actions-vscode-extension.git -b feat/file-system-provider  ${webPlaygroundPath}`, {stdio: 'inherit'});