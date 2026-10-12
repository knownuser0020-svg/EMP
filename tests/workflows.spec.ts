import { test, expect } from "@playwright/test";
test("dashboard renders every widget without errors or page overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  for (const name of ["Planned absences", "Future events", "New beginnings"])
    await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.locator(".leave-bar")).toHaveCount(6);
  expect(
    await page
      .getByRole("button", { name: /Liam Carter: Paid leave/ })
      .evaluate((e) => e.getBoundingClientRect().width),
  ).toBeGreaterThan(200);
  await expect(page.locator(".candidate-card")).toHaveCount(4);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
test("employee creation, search and persistence work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add employee", exact: true }).click();
  const d = page.getByRole("dialog");
  await d.getByLabel("Full name").fill("Alex Morgan");
  await d.getByLabel("Work email").fill("alex@forma.team");
  await d.getByLabel("Job title").fill("Product Designer");
  await d.getByLabel("Department").selectOption("Design");
  await d.getByRole("button", { name: "Add employee", exact: true }).click();
  await expect(d).toBeHidden();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Employees" })
    .click();
  await page.getByRole("textbox", { name: "Search employees" }).fill("Alex");
  await expect(
    page.getByRole("cell", { name: "alex@forma.team" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Search workspace" }).click();
  await page.getByPlaceholder("Who are you looking for?").fill("Alex");
  await expect(page.getByRole("dialog").getByText("Alex Morgan")).toBeVisible();
});
test("leave filter and approval update calendar records", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await page
    .locator(".filter-popover")
    .getByRole("button", { name: "Pending", exact: true })
    .click();
  await expect(page.locator(".leave-bar")).toHaveCount(2);
  await page.getByRole("button", { name: /Noah Mitchell: Sick leave/ }).click();
  await page.getByRole("button", { name: "Approve time off" }).click();
  await expect(page.locator(".leave-bar")).toHaveCount(1);
  await expect(page.getByRole("status")).toContainText("approved");
});
test("calendar paging clips leave intervals correctly", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Previous week" }).click();
  await expect(page.locator(".leave-bar")).toHaveCount(3);
  await page.getByTitle("Return to current week").click();
  await expect(page.locator(".leave-bar")).toHaveCount(6);
});
test("onboarding tasks persist and update the progress chip", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: /Sophia Adams UI\/UX Designer/ })
    .click();
  await page.getByRole("checkbox", { name: "Explore our product" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "6 of 10 steps complete",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Sophia Adams UI\/UX Designer/ }),
  ).toContainText("6/10");
});
test("workspace assistant answers from leave data", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Ask Forma assistant" })
    .fill("Who is on leave?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".chat-message.assistant")).toContainText(
    "2 pending leave requests",
  );
  await expect(page.locator(".chat-message.assistant")).toContainText("Noah");
});
test("calendar and CSV export produce real downloads", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Tech Innovations Summit/ }).click();
  let download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add to calendar" }).click();
  expect((await download).suggestedFilename()).toBe("forma-event.ics");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Reports" })
    .click();
  download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export team report" }).click();
  expect((await download).suggestedFilename()).toBe("forma-team-report.csv");
});
test("mobile navigation works without page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("button", { name: "Employees", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Good people. Great things." }),
  ).toBeVisible();
});
test("employee clocks in and out with explicit sharing controls", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:5174");
  await page.getByRole("button", { name: "Let’s clock in" }).click();
  await expect(page.getByText("On the clock", { exact: true })).toBeVisible();
  await page.getByRole("switch", { name: "Activity sharing" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "does not record typed text",
  );
  await expect(
    page.getByRole("button", { name: "Enable sharing" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Keep it off" }).click();
  await page.getByRole("button", { name: "Clock out", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Let’s clock in" }),
  ).toBeVisible();
});
test("employee completes a task and submits time off", async ({ page }) => {
  await page.goto("http://127.0.0.1:5174");
  await page.getByRole("checkbox", { name: "Explore our product" }).click();
  await expect(
    page.getByRole("checkbox", { name: "Explore our product" }),
  ).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Request time off" }).click();
  await page.getByLabel("From", { exact: true }).fill("2027-02-01");
  await page.getByLabel("Until", { exact: true }).fill("2027-02-03");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator(".employee-leave-list")).toContainText("Vacation");
  await expect(page.locator(".employee-leave-list")).toContainText("Pending");
});
