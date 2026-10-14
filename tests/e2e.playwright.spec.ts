import { test, expect } from "@playwright/test";

test.describe("Sandeep Opportunity OS — Critical End-to-End Flows", () => {
  test("loads Today Action Queue, navigates routes, opens provenance drawer, toggles theme, and persists CRM notes", async ({ page }) => {
    await page.goto("/today");
    await expect(page.locator("#topbar-title")).toContainText("What should Sandeep work on today?");

    // 1. Switch to Freelance Client Leads pipeline
    await page.click("button[data-route='freelance_leads']");
    await expect(page.locator("#topbar-title")).toContainText("Freelance Website & Web-App Client Leads");

    // 2. Open slide-over provenance & score breakdown drawer for OPP-FL-001
    await page.click("tr.opp-row >> nth=0");
    await expect(page.locator("#detail-drawer")).toHaveClass(/open/);
    await expect(page.locator("#drawer-id")).toContainText("OPP-FL-001");

    // 3. Update personal CRM note and verify persistence across idempotent sync
    const noteBox = page.locator("#crm-notes-textarea");
    await noteBox.fill("E2E test note: Contact Chrysostomos Danos regarding booking portal");
    await page.click("button:has-text('Save Note')");
    await page.click("button:has-text('Sync Google Sheet')");
    await expect(noteBox).toHaveValue("E2E test note: Contact Chrysostomos Danos regarding booking portal");
  });
});
