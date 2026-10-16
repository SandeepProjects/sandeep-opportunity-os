import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const SCREENSHOT_DIR = "C:/Users/bagos/.gemini/antigravity/brain/60bba5e2-e4b0-4237-a74a-4a761206ffb2/screenshots";

async function run() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const page = await context.newPage();

  // Inject authentication into localStorage
  await page.addInitScript(() => {
    window.localStorage.setItem("sandeep_neon_auth_token", "sess_e2e_valid_token");
    window.localStorage.setItem(
      "sandeep_neon_auth_user",
      JSON.stringify({
        id: "usr_sandeep_e2e",
        name: "Sandeep Gautam",
        email: "sandeep.gautam@opportunity-os.local",
        role: "admin"
      })
    );
  });

  console.log("Navigating to dev server at http://127.0.0.1:5173/explorer...");
  await page.goto("http://127.0.0.1:5173/explorer", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const adminLoginBtn = page.locator("button:has-text('One-Click Admin Login')");
  if (await adminLoginBtn.isVisible()) {
    console.log("Authenticating via One-Click Admin Login...");
    await adminLoginBtn.click();
    await page.waitForSelector(".os-breadcrumb-root", { timeout: 15000 });
    await page.goto("http://127.0.0.1:5173/explorer", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
  }

  // 1. Desktop Full HD 1920px (Dark)
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "explorer-desktop-dark-1920.png"), fullPage: false });
  console.log("Captured: explorer-desktop-dark-1920.png");

  // 2. Desktop Standard 1440px (Dark)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "explorer-desktop-dark-1440.png"), fullPage: false });
  console.log("Captured: explorer-desktop-dark-1440.png");

  // 3. Desktop Standard 1440px (Light Mode)
  const themeBtn = page.locator(".os-sidebar-controls button");
  if (await themeBtn.isVisible()) {
    await themeBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "explorer-desktop-light-1440.png"), fullPage: false });
    console.log("Captured: explorer-desktop-light-1440.png");
    // Switch back to dark mode
    await themeBtn.click();
    await page.waitForTimeout(400);
  } else {
    // Fallback: evaluate document attribute or trigger directly
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "explorer-desktop-light-1440.png"), fullPage: false });
    console.log("Captured (via html attr): explorer-desktop-light-1440.png");
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
    });
    await page.waitForTimeout(400);
  }

  // 4. Tablet Landscape 1024px
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "explorer-tablet-1024.png"), fullPage: false });
  console.log("Captured: explorer-tablet-1024.png");

  // 5. Tablet Portrait 768px
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "explorer-tablet-768.png"), fullPage: false });
  console.log("Captured: explorer-tablet-768.png");

  // 6. Mobile Portrait 390px (iPhone 14/15)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "explorer-mobile-390.png"), fullPage: false });
  console.log("Captured: explorer-mobile-390.png");

  // 7. Folder Overview at 1440px
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:5173/explorer?ws=ws_bagomuse&folder=f_social_hunter", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "folder-overview-1440.png"), fullPage: false });
  console.log("Captured: folder-overview-1440.png");

  // 8. Today Command Center at 1440px
  await page.goto("http://127.0.0.1:5173/today", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "today-command-1440.png"), fullPage: false });
  console.log("Captured: today-command-1440.png");

  await browser.close();
  console.log("All visual QA screenshots captured successfully.");
}

run().catch((err) => {
  console.error("Visual QA error:", err);
  process.exit(1);
});
