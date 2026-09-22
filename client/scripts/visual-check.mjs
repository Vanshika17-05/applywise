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

  await page.getByRole("button", { name: "Switch to day mode" }).click();
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
    await page.screenshot({ path: path.join(screenshots, "board-light.png"), fullPage: true });

    await page.getByRole("button", { name: "Switch to night mode" }).click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(screenshots, "board-dark.png"), fullPage: true });

    await page.getByRole("link", { name: "Analytics" }).click();
    await page.getByText("Application activity").waitFor();
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(screenshots, "analytics-dark.png"), fullPage: true });

    await page.getByRole("button", { name: "Switch to day mode" }).click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(screenshots, "analytics-light.png"), fullPage: true });
  }

  assert.deepEqual(pageErrors, [], `Browser errors: ${pageErrors.join("; ")}`);
  console.info(`Visual checks passed. Screenshots saved to ${screenshots}`);
} finally {
  await browser.close();
}
