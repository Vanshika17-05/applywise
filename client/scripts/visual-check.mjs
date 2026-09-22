import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const base = process.env.APPLYWISE_URL || "http://localhost:5173";
const screenshots = path.resolve(import.meta.dirname, "../../.screenshots");
await mkdir(screenshots, { recursive: true });

const browser = await chromium.launch({
  channel: process.env.CHROME_CHANNEL || "chrome",
  headless: true
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`${base}/auth`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.screenshot({ path: path.join(screenshots, "auth-dark.png") });
  const beam = page.locator(".hero-beams linearGradient").first();
  const beamPosition = await beam.getAttribute("x1");
  await page.waitForTimeout(650);
  assert.notEqual(await beam.getAttribute("x1"), beamPosition, "Background beams should move over time");

  await page.getByRole("button", { name: "Switch to light mode" }).click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  await page.screenshot({ path: path.join(screenshots, "auth-light.png") });

  if (process.env.DEMO_EMAIL && process.env.DEMO_PASSWORD) {
    await page.getByLabel("Email address").fill(process.env.DEMO_EMAIL);
    await page.getByLabel("Password").fill(process.env.DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByText("Application board").waitFor();
    await page.waitForTimeout(900);
    assert.equal(await page.getByText("Your next move starts here.").count(), 0, "The removed sidebar card should stay removed");
    await page.screenshot({ path: path.join(screenshots, "board-light.png"), fullPage: true });

    const dragHandle = page.getByLabel(/^Drag .* application$/).first();
    const targetLane = page.locator(".board-lane").nth(1);
    const dragBox = await dragHandle.boundingBox();
    const targetBox = await targetLane.boundingBox();
    assert.ok(dragBox && targetBox, "A demo application and destination lane should be visible");
    await page.mouse.move(dragBox.x + dragBox.width / 2, dragBox.y + dragBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(dragBox.x + dragBox.width / 2 + 8, dragBox.y + dragBox.height / 2, { steps: 4 });
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 150, { steps: 12 });
    await page.waitForTimeout(250);
    assert.equal(await page.locator(".board-lane-dragging").count(), 4, "All lanes should show dashed feedback while dragging");
    await page.screenshot({ path: path.join(screenshots, "board-drag-feedback.png"), fullPage: true });
    await page.mouse.up();
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(screenshots, "board-dark.png"), fullPage: true });

    await page.getByRole("link", { name: "Analytics" }).click();
    await page.getByText("Application activity").waitFor();
    await page.waitForTimeout(900);
    assert.ok(await page.locator(".recharts-pie-sector").count() >= 2, "The status breakdown should render a donut chart with data");
    await page.screenshot({ path: path.join(screenshots, "analytics-dark.png"), fullPage: true });

    await page.getByRole("button", { name: /^Open account menu for / }).click();
    await page.getByRole("menuitem", { name: "Settings" }).click();
    await page.getByRole("heading", { name: "Settings", exact: true }).waitFor();
    for (const label of ["Workspace", "Pipeline", "Applied"]) {
      const box = await page.locator("aside").getByText(label, { exact: true }).boundingBox();
      assert.ok(box && box.x >= 0 && box.x + box.width <= 260, `${label} should fit inside the sidebar`);
    }
    await page.screenshot({ path: path.join(screenshots, "settings-dark.png"), fullPage: true });

    await page.getByRole("button", { name: "Switch to light mode" }).click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(screenshots, "analytics-light.png"), fullPage: true });
  }

  assert.deepEqual(pageErrors, [], `Browser errors: ${pageErrors.join("; ")}`);
  console.info(`Visual checks passed. Screenshots saved to ${screenshots}`);
} finally {
  await browser.close();
}
