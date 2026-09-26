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

  await page.locator("#features").scrollIntoViewIfNeeded();
  await page.getByRole("heading", { name: "Everything your job search needs" }).waitFor();
  assert.equal(await page.locator(".landing-feature-card").count(), 3, "The landing page should show three feature cards");
  const darkLandingBackground = await page.locator(".landing-extended").evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.getByRole("heading", { name: "Your AI toolkit, built in" }).scrollIntoViewIfNeeded();
  await page.getByText("One-click cover letters tailored to each company and role").waitFor();
  await page.getByText("Job seekers using Applywise").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1250);
  assert.match(await page.locator(".landing-stat").first().textContent(), /500\+/, "Social proof should count up to 500+");
  await page.getByRole("heading", { name: "Ready to take control of your job search?" }).scrollIntoViewIfNeeded();
  const githubLink = page.getByRole("link", { name: "Applywise creator on GitHub" });
  const linkedinLink = page.getByRole("link", { name: "Applywise creator on LinkedIn" });
  await githubLink.scrollIntoViewIfNeeded();
  assert.equal(await githubLink.getAttribute("href"), "https://github.com/Vanshika17-05");
  assert.equal(await linkedinLink.getAttribute("href"), "https://in.linkedin.com/in/vanshikasambher");
  await page.screenshot({ path: path.join(screenshots, "landing-page-dark.png"), fullPage: true });
  await page.getByRole("button", { name: "See how it works" }).click();
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: "Switch to light mode" }).click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  assert.equal(await page.evaluate(() => localStorage.getItem("applywise-theme")), "light", "Theme choice must persist globally");
  const lightLandingBackground = await page.locator(".landing-extended").evaluate((element) => getComputedStyle(element).backgroundColor);
  assert.notEqual(lightLandingBackground, darkLandingBackground, "Landing sections must respond to the global light theme");
  await page.screenshot({ path: path.join(screenshots, "auth-light.png") });
  for (const target of [
    page.getByRole("heading", { name: "Everything your job search needs" }),
    page.getByRole("heading", { name: "Your AI toolkit, built in" }),
    page.getByText("Job seekers using Applywise"),
    page.getByRole("heading", { name: "Ready to take control of your job search?" }),
    page.getByRole("link", { name: "Applywise creator on GitHub" })
  ]) {
    await target.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: path.join(screenshots, "landing-page-light.png"), fullPage: true });

  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobilePage.goto(`${base}/auth`, { waitUntil: "networkidle" });
  await mobilePage.getByRole("heading", { name: "Everything your job search needs" }).scrollIntoViewIfNeeded();
  assert.equal(await mobilePage.locator(".landing-feature-card").count(), 3);
  for (const card of await mobilePage.locator(".landing-feature-card").all()) {
    await card.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(220);
  }
  await mobilePage.getByRole("heading", { name: "Your AI toolkit, built in" }).scrollIntoViewIfNeeded();
  await mobilePage.locator(".landing-ai-mockup").scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(500);
  for (const stat of await mobilePage.locator(".landing-stat").all()) {
    await stat.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(450);
  }
  assert.match(await mobilePage.locator(".landing-stat").first().textContent(), /500\+/, "Mobile social proof should finish its count-up");
  await mobilePage.getByRole("heading", { name: "Ready to take control of your job search?" }).scrollIntoViewIfNeeded();
  await mobilePage.getByRole("link", { name: "Applywise creator on GitHub" }).scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(screenshots, "landing-page-mobile.png"), fullPage: true });
  await mobilePage.close();

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

    const emailButton = page.locator('button[aria-label^="Generate follow-up email for "]').first();
    await emailButton.click();
    await page.getByRole("heading", { name: "Follow-up email" }).waitFor();
    await page.getByText("Generating your email", { exact: true }).waitFor();
    assert.equal(await emailButton.isDisabled(), true, "The AI email button should be disabled while generation is active");
    const skeletonVisible = await page.getByLabel("Generating AI response").count();
    const firstChunkVisible = (await page.locator(".ai-result-panel").last().textContent().catch(() => "")).length > 0;
    assert.ok(skeletonVisible === 1 || firstChunkVisible, "The AI modal should show a skeleton or the first streamed content");
    await page.getByRole("button", { name: "Copy text" }).waitFor({ timeout: 60000 });
    assert.ok((await page.locator(".ai-result-panel").last().textContent()).length > 80, "Follow-up output should be displayed in the modal");
    await page.screenshot({ path: path.join(screenshots, "ai-follow-up.png"), fullPage: true });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);

    await page.getByRole("button", { name: /^Generate interview tips for / }).first().click();
    await page.getByRole("heading", { name: "Interview tips" }).waitFor();
    await page.getByText("Preparing interview tips", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Copy text" }).waitFor({ timeout: 60000 });
    assert.ok((await page.locator(".ai-result-panel").last().textContent()).length > 80, "Interview tips should be displayed in the modal");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);

    assert.equal(await page.getByRole("button", { name: /^Generate cover letter for / }).count(), 0, "Cover Letter should not be duplicated on Kanban cards");
    assert.equal(await page.getByRole("button", { name: /^Analyze resume match for / }).count(), 0, "Resume Match should not be duplicated on Kanban cards");
    await page.getByRole("link", { name: "Open AI Career Studio" }).click();
    await page.getByRole("heading", { name: "AI Career Studio" }).waitFor();
    await page.getByRole("heading", { name: "One-click Cover Letter" }).waitFor();
    await page.getByRole("heading", { name: "Resume-to-JD Match" }).waitFor();
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: "Generate cover letter" }).click();
    await page.getByRole("button", { name: "Copy letter" }).waitFor({ timeout: 60000 });
    const resumePage = await browser.newPage();
    await resumePage.setContent("<h1>Vanshika — Software Engineer</h1><p>React, Node.js, MongoDB, REST APIs, scalable backend systems, and automated testing.</p>");
    const resumePdf = await resumePage.pdf({ format: "A4" });
    await resumePage.close();
    await page.locator("#ai-resume").setInputFiles({ name: "applywise-resume.pdf", mimeType: "application/pdf", buffer: resumePdf });
    await page.locator("#ai-job-description").fill("Seeking a React and Node.js engineer with MongoDB, AWS, automated testing, REST API, and scalable systems experience.");
    await page.getByRole("button", { name: "Analyze resume match" }).click();
    await page.getByText("Resume match", { exact: true }).waitFor({ timeout: 60000 });
    await page.getByRole("button", { name: "Copy analysis" }).waitFor();
    await page.screenshot({ path: path.join(screenshots, "ai-career-studio.png"), fullPage: true });

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
