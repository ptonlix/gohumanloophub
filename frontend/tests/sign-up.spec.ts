import { type Page, expect, test } from "@playwright/test"

import { randomEmail, randomPassword } from "./utils/random"

test.use({ storageState: { cookies: [], origins: [] } })

type OptionsType = {
  exact?: boolean
}

const fillForm = async (
  page: Page,
  full_name: string,
  email: string,
  password: string,
  confirm_password: string,
) => {
  await page.getByPlaceholder("Enter your full name").fill(full_name)
  await page.getByPlaceholder("Enter your email").fill(email)
  await page.getByPlaceholder("Enter your password").fill(password)
  await page.getByPlaceholder("Confirm your password").fill(confirm_password)
}

const verifyInput = async (
  page: Page,
  placeholder: string,
  options?: OptionsType,
) => {
  const input = page.getByPlaceholder(placeholder, options)
  await expect(input).toBeVisible()
  await expect(input).toHaveValue("")
  await expect(input).toBeEditable()
}

test("Inputs are visible, empty and editable", async ({ page }) => {
  await page.goto("/signup")

  await verifyInput(page, "Enter your full name")
  await verifyInput(page, "Enter your email")
  await verifyInput(page, "Enter your password")
  await verifyInput(page, "Confirm your password")
})

test("Sign Up button is visible", async ({ page }) => {
  await page.goto("/signup")

  await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible()
})

test("Log In link is visible", async ({ page }) => {
  await page.goto("/signup")

  await expect(page.getByRole("link", { name: "Log In" })).toBeVisible()
})

test("Sign up with valid name, email, and password", async ({ page }) => {
  const full_name = "Test User"
  const email = randomEmail()
  const password = randomPassword()

  await page.goto("/signup")
  await fillForm(page, full_name, email, password, password)
  await page.getByRole("button", { name: "Sign Up" }).click()
})

test("Sign up with invalid email", async ({ page }) => {
  await page.goto("/signup")

  await fillForm(
    page,
    "Playwright Test",
    "invalid-email",
    "changethis",
    "changethis",
  )
  await page.getByRole("button", { name: "Sign Up" }).click()

  await expect(page.getByText("请输入有效的邮箱地址")).toBeVisible()
})

test("Sign up with existing email", async ({ page }) => {
  const fullName = "Test User"
  const email = randomEmail()
  const password = randomPassword()

  // Sign up with an email
  await page.goto("/signup")

  await fillForm(page, fullName, email, password, password)
  await page.getByRole("button", { name: "Sign Up" }).click()

  // Sign up again with the same email
  await page.goto("/signup")

  await fillForm(page, fullName, email, password, password)
  await page.getByRole("button", { name: "Sign Up" }).click()

  await page
    .getByText("The user with this email already exists in the system")
    .click()
})

test("Sign up with weak password", async ({ page }) => {
  const fullName = "Test User"
  const email = randomEmail()
  const password = "weak"

  await page.goto("/signup")

  await fillForm(page, fullName, email, password, password)
  await page.getByRole("button", { name: "Sign Up" }).click()

  await expect(
    page.getByText("密码至少需要8个字符"),
  ).toBeVisible()
})

test("Sign up with mismatched passwords", async ({ page }) => {
  const fullName = "Test User"
  const email = randomEmail()
  const password = randomPassword()
  const password2 = randomPassword()

  await page.goto("/signup")

  await fillForm(page, fullName, email, password, password2)
  await page.getByRole("button", { name: "Sign Up" }).click()

  await expect(page.getByText("两次输入的密码不一致")).toBeVisible()
})

test("Sign up with missing full name", async ({ page }) => {
  const fullName = ""
  const email = randomEmail()
  const password = randomPassword()

  await page.goto("/signup")

  await fillForm(page, fullName, email, password, password)
  await page.getByRole("button", { name: "Sign Up" }).click()

  await expect(page.getByText("请输入姓名")).toBeVisible()
})

test("Sign up with missing email", async ({ page }) => {
  const fullName = "Test User"
  const email = ""
  const password = randomPassword()

  await page.goto("/signup")

  await fillForm(page, fullName, email, password, password)
  await page.getByRole("button", { name: "Sign Up" }).click()

  await expect(page.getByText("请输入邮箱")).toBeVisible()
})

test("Sign up with missing password", async ({ page }) => {
  const fullName = ""
  const email = randomEmail()
  const password = ""

  await page.goto("/signup")

  await fillForm(page, fullName, email, password, password)
  await page.getByRole("button", { name: "Sign Up" }).click()

  await expect(page.getByText("请输入密码")).toBeVisible()
})
