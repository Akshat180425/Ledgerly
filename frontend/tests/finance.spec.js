import { test, expect } from "@playwright/test";
const password = "Browser test password 2026!";
const day = new Date().toISOString().slice(0, 10);
const headers = { "X-Ledgerly-Request": "1" };
async function account(page, suffix) {
  await page.goto("/signup");
  const email = "browser-" + suffix + "-" + Date.now() + "@example.com";
  await page.getByLabel("Full name").fill("Alex Morgan");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your money at a glance" })).toBeVisible();
  return email;
}
async function create(page, path, data) {
  const response = await page.request.post("/api/v1/" + path, { headers, data });
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}
test("protected routes ignore stale local storage and validate the session", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => { localStorage.setItem("token", "not-a-real-token"); localStorage.setItem("user", '{"fullName":"Stale user"}'); });
  await page.goto("/goals");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
});
test("sign up, budgets, transactions, filtering, export, savings, recurring, and logout", async ({ page }) => {
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  const email = await account(page, "workflow");
  await page.getByRole("link", { name: "Budgets", exact: true }).click();
  await page.getByRole("button", { name: "New budget", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Category", { exact: true }).fill("Groceries");
  await page.getByLabel("Monthly limit").fill("100");
  await page.getByRole("button", { name: "Save budget" }).click();
  await expect(page.getByRole("heading", { name: "Groceries", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Transactions", exact: true }).click();
  await page.getByRole("button", { name: "Add transaction", exact: true }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Income", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Source", { exact: true }).fill("Salary");
  await page.getByRole("dialog").getByLabel("Amount", { exact: true }).fill("40000");
  await page.getByRole("button", { name: "Save transaction" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Add transaction", exact: true }).first().click();
  await page.getByRole("dialog").getByLabel("Category", { exact: true }).fill("Groceries");
  await page.getByRole("dialog").getByLabel("Amount", { exact: true }).fill("85");
  await page.getByRole("button", { name: "Save transaction" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page.getByLabel("Search transactions", { exact: true }).fill("grocer");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toContainText("Groceries");
  const download = page.waitForEvent("download");
  await page.getByLabel("Export transactions").selectOption("csv");
  expect((await download).suggestedFilename()).toBe("ledgerly-transactions.csv");
  await page.getByRole("button", { name: "Edit Groceries", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Amount", { exact: true }).fill("110");
  await page.getByRole("button", { name: "Save transaction" }).click();
  await page.getByRole("link", { name: "Budgets", exact: true }).click();
  await expect(page.getByText("Limit reached", { exact: true })).toBeVisible();
  await expect(page.getByText(/10.00 over/)).toBeVisible();
  await page.getByRole("link", { name: "Savings goals", exact: true }).click();
  await page.getByRole("button", { name: "New goal", exact: true }).click();
  await page.getByLabel("Goal name").fill("Emergency fund");
  await page.getByLabel("Target amount").fill("12000");
  await page.getByRole("button", { name: "Save goal", exact: true }).click();
  await page.getByRole("button", { name: "Contribution", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Amount", { exact: true }).fill("3000");
  await page.getByRole("button", { name: "Save contribution", exact: true }).click();
  await expect(page.getByText("25% saved")).toBeVisible();
  await page.getByRole("link", { name: "Recurring", exact: true }).click();
  await page.getByRole("button", { name: "New schedule", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Category", { exact: true }).fill("Rent");
  await page.getByRole("dialog").getByLabel("Amount", { exact: true }).fill("5000");
  await page.getByRole("dialog").getByLabel("First date", { exact: true }).fill(day);
  await page.getByRole("button", { name: "Save schedule", exact: true }).click();
  await expect(page.locator("tbody tr")).toContainText("Rent");
  await page.getByRole("checkbox", { name: "Active schedule: Rent" }).uncheck();
  await expect(page.getByRole("checkbox", { name: "Active schedule: Rent" })).not.toBeChecked();
  await page.getByRole("link", { name: "Analytics", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Daily activity", exact: true })).toBeVisible();
  await expect(page.locator(".recharts-surface").first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Analytics", exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
  expect(await page.evaluate(() => document.cookie.includes("ledgerly_session"))).toBeFalsy();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Analytics", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test("desktop and mobile charts, assets, forms, and navigation fit their viewports", async ({ page }, testInfo) => {
  await account(page, "visual");
  const categories = [["Groceries", 3400], ["Food & dining", 2400], ["Rent", 18000], ["Transport", 1850], ["Shopping", 4250]];
  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
    const date = new Date(); date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() - monthsAgo);
    await create(page, "income/add", { label: "Salary", amount: 68000 + (5 - monthsAgo) * 2000, date: date.toISOString().slice(0, 10) });
    for (const [label, amount] of categories) await create(page, "expense/add", { label, amount: amount + monthsAgo * 100, date: date.toISOString().slice(0, 10) });
  }
  const goal = await create(page, "goals", { name: "Emergency fund", targetAmount: 150000 });
  await create(page, "goals/" + goal._id + "/contributions", { amount: 62500, type: "deposit" });
  await create(page, "goals", { name: "Japan trip", targetAmount: 100000 });
  await create(page, "budgets", { scope: "category", category: "Groceries", amount: 6000, month: day.slice(0, 7) });
  await page.goto("/dashboard");
  await expect(page.locator(".recharts-surface").first()).toBeVisible();
  await expect(page.locator(".recharts-rectangle").first()).toBeVisible();
  await expect(page.locator(".recharts-pie-sector").first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("dashboard-desktop.png"), fullPage: true });
  const badImages = await page.locator("img").evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src));
  expect(badImages).toEqual([]);
  for (const width of [390, 320, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ["/dashboard", "/transactions", "/budgets", "/goals", "/recurring", "/analytics", "/settings"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator(".loading-state")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), path + " at " + width).toBeTruthy();
    }
    if (width === 390) {
      await page.goto("/dashboard");
      await expect(page.locator(".recharts-surface").first()).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath("dashboard-mobile.png"), fullPage: true });
      await page.getByRole("button", { name: "Open menu", exact: true }).click();
      await page.getByRole("link", { name: "Budgets", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Budgets", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "New budget", exact: true }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      expect(await page.getByRole("dialog").evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBeTruthy();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
  }
});
test("visible notifications do not intercept finance controls", async ({ page }) => {
  await account(page, "notifications");
  await page.getByRole("link", { name: "Budgets", exact: true }).click();
  await page.getByRole("button", { name: "New budget", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Category", { exact: true }).fill("Groceries");
  await page.getByLabel("Monthly limit").fill("5000");
  await page.getByRole("button", { name: "Save budget" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Budget saved" })).toBeVisible();
  expect(await page.locator(".ledgerly-notifications, .ledgerly-notifications *").evaluateAll(
    (nodes) => nodes.length > 1 && nodes.every((node) => getComputedStyle(node).pointerEvents === "none")
  )).toBeTruthy();
  await page.getByRole("link", { name: "Savings goals", exact: true }).click();
  await page.getByRole("button", { name: "New goal", exact: true }).click({ timeout: 3000 });
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("server failures offer retry and expired sessions return to login", async ({ page }) => {
  await account(page, "errors");
  await page.route("**/api/v1/transactions?**", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "Temporary test outage" }) }));
  await page.goto("/transactions");
  await expect(page.getByText("Temporary test outage")).toBeVisible();
  await page.unroute("**/api/v1/transactions?**");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No matching transactions" })).toBeVisible();
  await page.context().clearCookies();
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
});
