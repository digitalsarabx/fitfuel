/* Regenerates dist/ (the deployable, minified build) from source. Run: npm run build */
const { execSync } = require("child_process");
const fs = require("fs");

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

fs.rmSync("dist", { recursive: true, force: true });
["dist/css", "dist/js", "dist/data", "dist/images"].forEach((d) =>
  fs.mkdirSync(d, { recursive: true })
);

run("npx terser js/app.js -c -m -o dist/js/app.js");
run("npx cleancss -o dist/css/style.css css/style.css");
run(
  "npx html-minifier-terser --collapse-whitespace --remove-comments --minify-css true --minify-js true index.html -o dist/index.html"
);

fs.copyFileSync("data/products.json", "dist/data/products.json");
fs.readdirSync("images").forEach((f) =>
  fs.copyFileSync(`images/${f}`, `dist/images/${f}`)
);

console.log("Build complete → dist/");
