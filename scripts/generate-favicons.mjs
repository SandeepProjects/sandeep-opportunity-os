import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const svgPath = path.resolve("public/favicon.svg");
  const svgContent = fs.readFileSync(svgPath, "utf8");

  const browser = await chromium.launch();

  // 1. Generate Apple Touch Icon (180x180)
  const page180 = await browser.newPage();
  await page180.setViewportSize({ width: 180, height: 180 });
  await page180.setContent(`<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 180px; height: 180px; overflow: hidden; background: transparent; }
    svg { width: 180px; height: 180px; display: block; }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`);
  await page180.screenshot({ path: path.resolve("public/apple-touch-icon.png"), omitBackground: true });
  await page180.close();

  // 2. Generate Favicon 32x32 PNG
  const page32 = await browser.newPage();
  await page32.setViewportSize({ width: 32, height: 32 });
  await page32.setContent(`<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 32px; height: 32px; overflow: hidden; background: transparent; }
    svg { width: 32px; height: 32px; display: block; }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`);
  await page32.screenshot({ path: path.resolve("public/favicon-32x32.png"), omitBackground: true });
  await page32.close();

  // 3. Duplicate 32x32 PNG as favicon.ico and favicon.png for maximum cross-browser compatibility
  fs.copyFileSync(path.resolve("public/favicon-32x32.png"), path.resolve("public/favicon.ico"));
  fs.copyFileSync(path.resolve("public/favicon-32x32.png"), path.resolve("public/favicon.png"));

  await browser.close();
  console.log("Favicons generated successfully in public/ (SVG, 180x180, 32x32, ICO).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
