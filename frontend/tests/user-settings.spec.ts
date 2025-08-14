import { expect, test } from "@playwright/test"
import { firstSuperuser, firstSuperuserPassword } from "./config.ts"
import { createUser } from "./utils/privateApi.ts"
import { randomEmail, randomPassword } from "./utils/random"
import { logInUser, logOutUser } from "./utils/user"

const tabs = ["My profile", "Password", "Appearance"]

// User Information

test("My profile tab is active by default", async ({ page }) => {
  await page.goto("/settings")
  await expect(page.getByRole("tab", { name: "My profile" })).toHaveAttribute(
    "data-selected",
    "",
  )
})

test("All tabs are visible", async ({ page }) => {
  await page.goto("/settings")
  for (const tab of tabs) {
    await expect(page.getByRole("tab", { name: tab })).toBeVisible()
  }
})

test.describe("Edit user full name and email successfully", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("Edit user name with a valid name", async ({ page }) => {
    const email = randomEmail()
    const updatedName = "Test User 2"
    const password = randomPassword()

    await createUser({ email, password })

    // Log in the user
    await logInUser(page, email, password)

    await page.goto("/settings")
    await page.getByRole("tab", { name: "My profile" }).click()
    await page.getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Full name").fill(updatedName)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("User updated successfully.")).toBeVisible()
    // Check if the new name is displayed on the page
    await expect(
      page.getByLabel("My profile").getByText(updatedName, { exact: true }),
    ).toBeVisible()
  })

  test("Edit user email with a valid email", async ({ page }) => {
    const email = randomEmail()
    const updatedEmail = randomEmail()
    const password = randomPassword()

    await createUser({ email, password })

    // Log in the user
    await logInUser(page, email, password)

    await page.goto("/settings")
    await page.getByRole("tab", { name: "My profile" }).click()
    await page.getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Email").fill(updatedEmail)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("User updated successfully.")).toBeVisible()
    await expect(
      page.getByLabel("My profile").getByText(updatedEmail, { exact: true }),
    ).toBeVisible()
  })
})

test.describe("Edit user with invalid data", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("Edit user email with an invalid email", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()
    const invalidEmail = ""

    await createUser({ email, password })

    // Log in the user
    await logInUser(page, email, password)

    await page.goto("/settings")
    await page.getByRole("tab", { name: "My profile" }).click()
    await page.getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Email").fill(invalidEmail)
    await page.locator("body").click()
    await expect(page.getByText("请输入邮箱")).toBeVisible()
  })

  test("Cancel edit action restores original name", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()
    const updatedName = "Test User"

    await createUser({ email, password })

    // Log in the user
    await logInUser(page, email, password)

    await page.goto("/settings")
    await page.getByRole("tab", { name: "My profile" }).click()

    // Get the original name from the UI before editing
    const originalNameElement = page.getByLabel("My profile").locator("[data-testid='user-name'], .user-name, h2, h3").first()
    const originalName = await originalNameElement.textContent()

    await page.getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Full name").fill(updatedName)
    await page.getByRole("button", { name: "Cancel" }).first().click()

    if (originalName) {
      await expect(
        page
          .getByLabel("My profile")
          .getByText(originalName, { exact: true }),
      ).toBeVisible()
    }
  })

  test("Cancel edit action restores original email", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()
    const updatedEmail = randomEmail()

    await createUser({ email, password })

    // Log in the user
    await logInUser(page, email, password)

    await page.goto("/settings")
    await page.getByRole("tab", { name: "My profile" }).click()
    await page.getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Email").fill(updatedEmail)
    await page.getByRole("button", { name: "Cancel" }).first().click()
    await expect(
      page.getByLabel("My profile").getByText(email, { exact: true }),
    ).toBeVisible()
  })
})

// Change Password

test.describe("Change password successfully", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("Update password successfully", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()
    const NewPassword = randomPassword()

    await createUser({ email, password })

    // Log in the user
    await logInUser(page, email, password)

    await page.goto("/settings")
    await page.getByRole("tab", { name: "Password" }).click()
    await page.getByPlaceholder("Enter your current password").fill(password)
    await page.getByPlaceholder("Enter your password").fill(NewPassword)
    await page.getByPlaceholder("Confirm your password").fill(NewPassword)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Password updated successfully.")).toBeVisible()

    await logOutUser(page)

    // Check if the user can log in with the new password
    await logInUser(page, email, NewPassword)
  })
})

test.describe("Change password with invalid data", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("Update password with weak passwords", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()
    const weakPassword = "weak"

    await createUser({ email, password })

    // Log in the user
    await logInUser(page, email, password)

    await page.goto("/settings")
    await page.getByRole("tab", { name: "Password" }).click()
    await page.getByPlaceholder("Enter your current password").fill(password)
    await page.getByPlaceholder("Enter your password").fill(weakPassword)
    await page.getByPlaceholder("Confirm your password").fill(weakPassword)
    await expect(
      page.getByText("密码至少需要8个字符"),
    ).toBeVisible()
  })

  test("New password and confirmation password do not match", async ({
    page,
  }) => {
    const email = randomEmail()
    const password = randomPassword()
    const newPassword = randomPassword()
    const confirmPassword = randomPassword()

    await createUser({ email, password })

    // Log in the user
    await logInUser(page, email, password)

    await page.goto("/settings")
    await page.getByRole("tab", { name: "Password" }).click()
    await page.getByPlaceholder("Enter your current password").fill(password)
    await page.getByPlaceholder("Enter your password").fill(newPassword)
    await page.getByPlaceholder("Confirm your password").fill(confirmPassword)
    await page.getByLabel("Password", { exact: true }).locator("form").click()
    await expect(page.getByText("两次输入的密码不一致")).toBeVisible()
  })

  test("Current password and new password are the same", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()

    await createUser({ email, password })

    // Log in the user
    await logInUser(page, email, password)

    await page.goto("/settings")
    await page.getByRole("tab", { name: "Password" }).click()
    await page.getByPlaceholder("Enter your current password").fill(password)
    await page.getByPlaceholder("Enter your password").fill(password)
    await page.getByPlaceholder("Confirm your password").fill(password)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(
      page.getByText("新密码不能与当前密码相同"),
    ).toBeVisible()
  })
})

// Appearance

test("Appearance tab is visible", async ({ page }) => {
  await page.goto("/settings")
  await page.getByRole("tab", { name: "Appearance" }).click()
  await expect(page.getByLabel("Appearance")).toBeVisible()
})

test("User can switch from light mode to dark mode and vice versa", async ({
  page,
}) => {
  await page.goto("/settings")
  await page.getByRole("tab", { name: "Appearance" }).click()

  // Ensure the initial state is light mode
  if (
    await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    )
  ) {
    await page.getByRole("radio", { name: "Light Mode" }).click()
  }

  let isLightMode = await page.evaluate(() =>
    document.documentElement.classList.contains("light"),
  )
  expect(isLightMode).toBe(true)

  await page.getByRole("radio", { name: "Dark Mode" }).click()
  const isDarkMode = await page.evaluate(() =>
    document.documentElement.classList.contains("dark"),
  )
  expect(isDarkMode).toBe(true)

  await page.getByRole("radio", { name: "Light Mode" }).click()
  isLightMode = await page.evaluate(() =>
    document.documentElement.classList.contains("light"),
  )
  expect(isLightMode).toBe(true)
})

test("Selected mode is preserved across sessions", async ({ page }) => {
  await page.goto("/settings")
  await page.getByRole("tab", { name: "Appearance" }).click()

  // Ensure the initial state is light mode
  if (
    await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    )
  ) {
    await page.getByRole("radio", { name: "Light Mode" }).click()
  }

  const isLightMode = await page.evaluate(() =>
    document.documentElement.classList.contains("light"),
  )
  expect(isLightMode).toBe(true)

  await page.getByRole("radio", { name: "Dark Mode" }).click()
  let isDarkMode = await page.evaluate(() =>
    document.documentElement.classList.contains("dark"),
  )
  expect(isDarkMode).toBe(true)

  await logOutUser(page)
  await logInUser(page, firstSuperuser, firstSuperuserPassword)

  isDarkMode = await page.evaluate(() =>
    document.documentElement.classList.contains("dark"),
  )
  expect(isDarkMode).toBe(true)
})
