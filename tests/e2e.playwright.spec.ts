import { test, expect } from "@playwright/test";

test.describe("Sandeep Opportunity OS — Full E2E & Responsive Verification Suite", () => {
  test("verifies all 8 routes, navigation, back/forward history, detail drawer, CRM persistence, theme toggle, and mobile viewports with zero console errors", async ({
    page
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    const routes = [
      { path: "/today", heading: "What should Sandeep work on today?" },
      { path: "/freelance", heading: "Freelance Website & Web-App Client Leads" },
      { path: "/jobs", heading: "Cyprus On-Site & EU Visa-Sponsoring Roles" },
      { path: "/masters", heading: "Master's Degrees & Funded Scholarships" },
      { path: "/remote", heading: "Remote Jobs & Paid Internships (Cyprus / EMEA)" },
      { path: "/saved", heading: "Saved Opportunities & Active Follow-Ups" },
      { path: "/operations", heading: "Operations & Synchronization Health" },
      { path: "/profile", heading: "Sandeep Gautam — Profile & Legal State" }
    ];

    for (const r of routes) {
      await page.goto(r.path);
      await expect(page.locator("#topbar-title")).toContainText(r.heading);
    }

    // Navigation & Browser Back/Forward
    await page.goto("/today");
    await page.click("button[data-route='freelance_leads']");
    await expect(page.locator("#topbar-title")).toContainText(
      "Freelance Website & Web-App Client Leads"
    );
    await page.click("button[data-route='visa_jobs']");
    await expect(page.locator("#topbar-title")).toContainText(
      "Cyprus On-Site & EU Visa-Sponsoring Roles"
    );

    await page.goBack();
    await expect(page.locator("#topbar-title")).toContainText(
      "Freelance Website & Web-App Client Leads"
    );
    await page.goForward();
    await expect(page.locator("#topbar-title")).toContainText(
      "Cyprus On-Site & EU Visa-Sponsoring Roles"
    );

    // Search filter control
    await page.fill("input[type='search']", "3CX");
    await expect(page.locator("tr.opp-row")).toHaveCount(1);
    await page.fill("input[type='search']", "");

    // Open Detail Drawer & Persist CRM Note
    await page.click("button[data-route='freelance_leads']");
    await page.click("tr.opp-row >> nth=0");
    await expect(page.locator("#detail-drawer")).toHaveClass(/open/);
    await expect(page.locator("#drawer-id")).toContainText("OPP-FL-001");

    const noteBox = page.locator("#crm-notes-textarea");
    await noteBox.fill("E2E test note: Contact Chrysostomos Danos regarding booking portal");
    await page.click("button:has-text('Save Note')");
    await page.click("#detail-drawer button:has-text('Close')");

    // Trigger idempotent Google Sheet / research refresh and reopen drawer to verify CRM persistence
    await page.click("button:has-text('Sync Google Sheet')");
    await page.click("tr.opp-row >> nth=0");
    await expect(page.locator("#crm-notes-textarea")).toHaveValue(
      "E2E test note: Contact Chrysostomos Danos regarding booking portal"
    );
    await page.click("#detail-drawer button:has-text('Close')");

    // Light & Dark Theme Toggle
    await expect(page.locator(".app-layout")).toHaveAttribute("data-theme", "dark");
    await page.click("button[aria-label='Toggle color theme']");
    await expect(page.locator(".app-layout")).toHaveAttribute("data-theme", "light");
    await page.click("button[aria-label='Toggle color theme']");
    await expect(page.locator(".app-layout")).toHaveAttribute("data-theme", "dark");

    // Responsive Viewports (1440, 1024, 430, 390)
    for (const width of [1440, 1024, 430, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/today");
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(hasOverflow).toBe(false);
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});
