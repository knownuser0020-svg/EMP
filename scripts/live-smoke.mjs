import { chromium, expect } from "@playwright/test";
if (!process.env.EMS_DEMO_PASSWORD)
  throw new Error("Supply the private local demo password via environment");
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  for (const [port, email, audience] of [
    [5175, "emily@forma.team", "admin"],
    [5176, "sophia@forma.team", "employee"],
  ]) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${port}`);
    await page.getByLabel("Work email").fill(email);
    await page
      .getByLabel("Password", { exact: true })
      .fill(process.env.EMS_DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in to Forma" }).click();
    if (audience === "admin") {
      await expect(
        page.getByRole("heading", { name: "Planned absences" }),
      ).toBeVisible();
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("button", { name: "Employees" })
        .click();
      await expect(
        page.getByRole("cell", { name: "emily@forma.team" }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByRole("checkbox", { name: "Explore our product" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Let’s clock in" }).click();
      await expect(
        page.getByText("On the clock", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Clock out", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Let’s clock in" }),
      ).toBeVisible();
    }
    expect(errors).toEqual([]);
    console.log(`Live ${audience} login and workflow verified.`);
    await page.close();
  }
} finally {
  await browser.close();
}
