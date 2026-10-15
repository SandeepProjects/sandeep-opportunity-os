import { test, expect } from "@playwright/test";

const ROUTES = [
  ["/today", "Today Command Center"],
  ["/freelance", "Freelance Client Leads"],
  ["/jobs", "Visa & Cyprus Jobs"],
  ["/masters", "Master's & Scholarships"],
  ["/remote", "Remote & Internships"],
  ["/saved", "Saved & CRM Follow-ups"],
  ["/operations", "System Operations & Evidence"],
  ["/profile", "Candidate Profile & Governance"]
] as const;

test.describe("Sandeep Opportunity OS — enterprise frontend flows", () => {
  test("all eight routes render current shell metadata", async ({ page }) => {
    for (const [path, breadcrumb] of ROUTES) {
      await page.goto(path);
      await expect(page.locator(".os-breadcrumb-current")).toHaveText(breadcrumb);
      await expect(page.locator(".os-page-header")).toBeVisible();
    }
  });

  test("workspace drawer traps focus, persists CRM notes across reload, and closes with Escape", async ({ page }) => {
    await page.goto("/freelance");
    let firstRecord = page.locator(".responsive-switch [role='button']:visible").first();
    await firstRecord.focus();
    await firstRecord.press("Enter");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("button", { name: /Close inspector drawer/ })).toBeFocused();

    const noteBox = page.locator("#drawer-crm-note");
    const note = "E2E persistence check — contact lead with verified case-study evidence";
    await noteBox.fill(note);
    await page.getByRole("button", { name: "Save CRM Note" }).click();
    await page.waitForTimeout(300);

    await page.reload();
    firstRecord = page.locator(".responsive-switch [role='button']:visible").first();
    await firstRecord.focus();
    await firstRecord.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(noteBox).toHaveValue(note);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(firstRecord).toBeFocused();
  });

  test("Today uses the runtime date instead of the old hard-coded 14 October value", async ({ page }) => {
    await page.goto("/today");
    const title = page.locator(".os-page-title");
    await expect(title).toContainText("Sandeep");
    await expect(title).not.toContainText("14 October 2026");
  });

  test("390px CRM view uses cards instead of a squeezed table", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/freelance");
    await expect(page.locator(".responsive-switch .os-table")).toBeHidden();
    const cards = page.locator(".responsive-switch .os-mobile-card");
    await expect(cards.first()).toBeVisible();
  });

  test("light and dark themes remain available", async ({ page }) => {
    await page.goto("/today");
    const shell = page.locator(".os-shell");
    await expect(shell).toHaveAttribute("data-theme", "dark");
    if ((page.viewportSize()?.width || 0) <= 768) {
      await page.getByRole("button", { name: "Toggle navigation drawer" }).click();
    }
    await page.getByRole("button", { name: "Switch to light mode" }).click();
    await expect(shell).toHaveAttribute("data-theme", "light");
  });

  test("Operations renders data source sections and manual sync runs", async ({ page }) => {
    await page.goto("/operations");
    await expect(page.locator("h2:has-text('Automated 6-Hour Scheduler & Sync Telemetry')")).toBeVisible();
    await expect(page.locator("h2:has-text('1. Google Sheets Sources')")).toBeVisible();
    await expect(page.locator("h2:has-text('2. Google Drive Trackers')")).toBeVisible();
    await expect(page.locator("h2:has-text('3. Local-Only Muse Workstation Trackers')")).toBeVisible();
    await expect(page.locator("h2:has-text('4. Canonical Database')")).toBeVisible();
    await expect(page.locator("h2:has-text('5. Legacy & Disconnected')")).toBeVisible();

    // Verify setup guide toggle
    const toggleBtn = page.getByRole("button", { name: "Service Account Setup Guide" });
    await toggleBtn.click();
    await expect(page.locator(".os-setup-guide")).toBeVisible();

    // Trigger sync
    const syncBtn = page.getByRole("button", { name: "Sync Data Now" });
    await syncBtn.click();
    await expect(page.locator(".os-telemetry-val:has-text('Records')")).toBeVisible();
  });

  test("Opportunity drawer renders Sources & Files / Drive Pack section", async ({ page }) => {
    await page.goto("/jobs");
    const firstRecord = page.locator(".responsive-switch [role='button']:visible").first();
    await firstRecord.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await expect(page.locator("h3:has-text('6. Sources & Files / Drive Pack')")).toBeVisible();
    await expect(page.locator(".os-drive-pack-card:has-text('Source Tracker')")).toBeVisible();
    await expect(page.locator(".os-drive-pack-card:has-text('Drive Application Pack')")).toBeVisible();
  });
});
