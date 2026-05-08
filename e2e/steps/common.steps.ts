import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { dwellForDemo } from '../support/dwell'

const { Given, When, Then } = createBdd()

Given('I am on the home page', async ({ page }) => {
  await page.goto('/')
  await dwellForDemo(page)
})

When('I navigate to the StepUp Scholars page', async ({ page }) => {
  await page.goto('/programs/stepup-scholars')
  await dwellForDemo(page)
})

When('I navigate to the Dynamerge page', async ({ page }) => {
  await page.goto('/programs/dynamerge')
  await dwellForDemo(page)
})

When('I navigate to the About page', async ({ page }) => {
  await page.goto('/about')
  await dwellForDemo(page)
})

When('I navigate to the Get Involved page', async ({ page }) => {
  await page.goto('/get-involved')
  await dwellForDemo(page)
})

When('I navigate to the Contact page', async ({ page }) => {
  await page.goto('/contact')
  await dwellForDemo(page)
})

Then('the contact page should be visible', async ({ page }) => {
  await expect(page).toHaveURL(/\/contact$/)
  // Longer dwell on the final beat so the end-state reads as a still.
  await dwellForDemo(page, Number(process.env.DEMO_TAIL_MS ?? 2500))
})
