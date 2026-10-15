import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import AxeBuilder from '@axe-core/playwright'

async function checkAccessibility(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => {})),
    )
  })
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(
    result.violations.map((item) => ({
      id: item.id,
      impact: item.impact,
      nodes: item.nodes.map((node) => node.target),
    })),
  ).toEqual([])
}

const continueButton = (page: Page) => page.getByRole('button', { name: 'Continue', exact: true })
async function enterCover(page: Page, visa: 'Employee' | 'Investor') {
  await page.getByRole('radio', { name: new RegExp(`^${visa}`) }).check()
  await expect(page.getByRole('heading', { name: 'Which visa are you on?' })).toBeVisible()
  await continueButton(page).click()
  await page.getByRole('button', { name: 'Pakistan', exact: true }).click()
  await continueButton(page).click()
  await page
    .getByRole('radio', { name: visa === 'Employee' ? 'Dubai' : 'Abu Dhabi', exact: true })
    .check()
  await continueButton(page).click()
  await page.getByRole('radio', { name: /^Renewal/ }).check()
  await continueButton(page).click()
}
async function enterApplicant(page: Page, salary: 'above' | 'below' | 'pending' = 'above') {
  await page.getByRole('radio', { name: 'Male', exact: true }).check()
  await page.getByRole('radio', { name: 'Married', exact: true }).check()
  await continueButton(page).click()
  await page.getByLabel('Date of birth', { exact: true }).fill('1990-05-15')
  if (salary === 'pending')
    await page.getByRole('button', { name: 'I earn exactly AED 4,000', exact: true }).click()
  else
    await page
      .getByRole('radio', {
        name: salary === 'above' ? 'Above AED 4,000' : 'Below AED 4,000',
        exact: true,
      })
      .check()
  await continueButton(page).click()
  await page.getByLabel('Full name', { exact: true }).fill('Omar Example')
  await page.getByLabel('Email address', { exact: true }).fill('omar@example.invalid')
  await page.getByLabel('Mobile number', { exact: true }).fill('500000000')
  await continueButton(page).click()
}
async function enterMember(page: Page, name: string, birthday: string, gender: 'Male' | 'Female') {
  await page.getByLabel('Full name', { exact: true }).fill(name)
  await page.getByLabel('Date of birth', { exact: true }).fill(birthday)
  await page.getByRole('radio', { name: gender, exact: true }).check()
}
async function verifyDemo(page: Page) {
  await page.getByRole('button', { name: 'Continue to verification', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Verify your mobile', exact: true })
  await expect(dialog.getByText('Demo verification', { exact: true })).toBeVisible()
  await dialog.getByLabel('OTP 1', { exact: true }).fill('000000')
  await dialog.getByRole('button', { name: 'Verify & finish preview', exact: true }).click()
  await expect(dialog.getByText('Use the demo code 123456.', { exact: true })).toBeVisible()
  await dialog.getByLabel('OTP 1', { exact: true }).fill('123456')
  await dialog.getByRole('button', { name: 'Verify & finish preview', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Your inquiry preview is ready.', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Local preview only. No inquiry has been submitted.', { exact: true }),
  ).toBeVisible()
}

for (const visa of ['Employee', 'Investor'] as const) {
  for (const target of ['Just me', 'Me & my dependents', 'Dependents only'] as const) {
    test(`${visa} / ${target}: complete the local inquiry`, async ({ page }) => {
      const errors: string[] = []
      const apiRequests: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('request', (request) => {
        if (/\/_api\/|cloudflow/i.test(request.url())) apiRequests.push(request.url())
      })
      await page.goto('/')
      await page.getByRole('link', { name: new RegExp(`^${target.replace('&', '\\&')}`) }).click()
      await enterCover(page, visa)
      await enterApplicant(
        page,
        target === 'Dependents only' ? 'pending' : target === 'Just me' ? 'above' : 'below',
      )
      if (target === 'Just me') {
        await expect(
          page.getByRole('heading', { name: 'One last look.', exact: true }),
        ).toBeVisible()
        await expect(page.locator('.stepper')).not.toContainText('Family')
      } else {
        await expect(
          page.getByRole('heading', { name: 'Let’s add the people you love.', exact: true }),
        ).toBeVisible()
        if (target === 'Dependents only')
          await expect(page.locator('.cover-summary')).toContainText(
            'You are the sponsor and are not included',
          )
        await page.getByRole('button', { name: 'Parent', exact: true }).click()
        await expect(page.getByRole('radio', { name: 'Male', exact: true })).not.toBeChecked()
        await expect(page.getByRole('radio', { name: 'Female', exact: true })).not.toBeChecked()
        await enterMember(page, 'Amina Example', '1958-02-01', 'Female')
        await page.getByRole('button', { name: 'Save member', exact: true }).click()
        if (visa === 'Employee' && target === 'Me & my dependents') {
          await page
            .locator('.member-switcher')
            .getByRole('button', { name: /^Amina/ })
            .click()
          await page.getByRole('button', { name: 'Remove', exact: true }).click()
          await page
            .locator('.member-switcher')
            .getByRole('button', { name: 'Add person', exact: true })
            .click()
          await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Spouse', exact: true })
            .click()
          await expect(page.getByRole('radio', { name: 'Female', exact: true })).not.toBeChecked()
          await enterMember(page, 'Sara Example', '1993-08-22', 'Female')
          await page.getByRole('button', { name: 'Save member', exact: true }).click()
          await page.getByRole('button', { name: 'Add person', exact: true }).click()
          await expect(
            page.getByRole('dialog').getByRole('button', { name: /Spouse/ }),
          ).toBeDisabled()
          await page.getByRole('dialog').getByRole('button', { name: 'Child', exact: true }).click()
          await enterMember(page, 'Adam Example', '2018-05-08', 'Male')
          await page.evaluate(() => document.fonts.ready)
          await mkdir('.qa', { recursive: true })
          await checkAccessibility(page)
          const toastClose = page.locator('.toast-region .icon-button')
          if (await toastClose.count()) await toastClose.click()
          await page.locator('#step-heading').focus()
          await page.evaluate(() => window.scrollTo(0, 0))
          await page.screenshot({ path: '.qa/family-desktop-viewport.png', animations: 'disabled' })
          await page.screenshot({
            path: '.qa/family-desktop.png',
            fullPage: true,
            animations: 'disabled',
          })
          await page.getByRole('button', { name: 'Save member', exact: true }).click()
          await page.locator('.member-switcher').getByRole('button', { name: /^Sara/ }).click()
          await page.getByRole('button', { name: 'Remove', exact: true }).click()
          await page.getByRole('button', { name: 'Undo', exact: true }).click()
          await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Sara Example')
          await page.getByRole('button', { name: 'Save member', exact: true }).click()
        }
        await page.getByRole('button', { name: 'Continue to review', exact: true }).click()
        await expect(
          page.getByRole('heading', { name: 'One last look.', exact: true }),
        ).toBeVisible()
        if (target === 'Dependents only')
          await expect(page.locator('.stage-review')).toContainText('Salary band to be confirmed')
      }
      await verifyDemo(page)
      await page.getByRole('button', { name: 'View my inquiries', exact: true }).click()
      await expect(page.locator('.inquiry-record')).toHaveCount(1)
      await page.getByRole('button', { name: 'View details', exact: true }).click()
      await expect(
        page.getByRole('dialog').getByText('omar@example.invalid', { exact: true }),
      ).toBeVisible()
      expect(page.url()).not.toMatch(/Omar|omar|500000000|1990/)
      expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([])
      expect(apiRequests).toEqual([])
      expect(errors).toEqual([])
    })
  }
}

test('validation, searchable nationality, back navigation, and preserving members when cancelling a coverage change', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('link', { name: /^Me & my dependents/ }).focus()
  await page.keyboard.press('Enter')
  await continueButton(page).click()
  await expect(page.getByRole('alert')).toContainText('Please check the highlighted fields.')
  await expect(page.getByRole('radio', { name: /^Employee/ })).toBeFocused()
  await page.getByRole('radio', { name: /^Employee/ }).check()
  await continueButton(page).click()
  await page.getByRole('button', { name: 'Choose your nationality', exact: true }).click()
  const countryDialog = page.getByRole('dialog', { name: 'Choose your nationality', exact: true })
  await countryDialog.getByRole('textbox').fill('unfindablecountry')
  await expect(countryDialog.getByRole('status')).toContainText('No countries match')
  await countryDialog.getByRole('textbox').fill('Canada')
  await page.screenshot({ path: '.qa/country-picker.png', animations: 'disabled' })
  await countryDialog.getByRole('button', { name: /Canada/ }).click()
  await continueButton(page).click()
  await page.getByRole('radio', { name: 'Dubai', exact: true }).check()
  await continueButton(page).click()
  await page.getByRole('radio', { name: /^New visa/ }).check()
  await continueButton(page).click()
  await page.getByRole('radio', { name: 'Female', exact: true }).check()
  await page.getByRole('radio', { name: 'Married', exact: true }).check()
  await continueButton(page).click()
  await page.getByLabel('Date of birth', { exact: true }).fill('2099-01-01')
  await continueButton(page).click()
  await expect(page.locator('.field-error').first()).toContainText('not in the future')
  await page.getByLabel('Date of birth', { exact: true }).fill('1993-01-01')
  await page.getByRole('radio', { name: 'Below AED 4,000', exact: true }).check()
  await continueButton(page).click()
  await page.getByLabel('Full name', { exact: true }).fill('Sara Example')
  await page.getByLabel('Email address', { exact: true }).fill('invalid')
  await page.getByLabel('Mobile number', { exact: true }).fill('12')
  await continueButton(page).click()
  await expect(page.getByLabel('Email address', { exact: true })).toBeFocused()
  await page.getByLabel('Email address', { exact: true }).fill('sara@example.invalid')
  await page.getByLabel('Mobile number', { exact: true }).fill('500000000')
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(page.getByLabel('Date of birth', { exact: true })).toHaveValue('01/01/1993')
  await continueButton(page).click()
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Sara Example')
  await continueButton(page).click()
  await page.getByRole('button', { name: 'Parent', exact: true }).click()
  await enterMember(page, 'Parent Example', '1961-01-01', 'Male')
  await page.getByRole('button', { name: 'Save member', exact: true }).click()
  await page.getByRole('button', { name: 'Change who needs cover', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('radio', { name: /^Just me/ })
    .check()
  await page.getByRole('button', { name: 'Apply changes', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Switch to Just me?', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.locator('.member-switcher')).toContainText('Parent')
  await page.getByRole('button', { name: 'Change who needs cover', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('radio', { name: /^Just me/ })
    .check()
  await page.getByRole('button', { name: 'Apply changes', exact: true }).click()
  await page.getByRole('button', { name: 'Switch to Just me', exact: true }).click()
  await expect(page.locator('.cover-summary')).toContainText('Just me')
  for (let index = 0; index < 4; index++) await continueButton(page).click()
  await expect(page.getByRole('radio', { name: 'Female', exact: true })).toBeChecked()
  await continueButton(page).click()
  await expect(page.getByLabel('Date of birth', { exact: true })).toHaveValue('01/01/1993')
  await continueButton(page).click()
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Sara Example')
  await continueButton(page).click()
  await expect(page.getByRole('heading', { name: 'One last look.', exact: true })).toBeVisible()
  await expect(page.locator('.review-member')).toHaveCount(0)
})

test('accessible landing, inquiry controls and country dialog; skip link preserves the hash route', async ({
  page,
}) => {
  await page.goto('/')
  await checkAccessibility(page)
  await page.getByRole('link', { name: /^Just me/ }).click()
  const route = page.url()
  await page.getByRole('link', { name: 'Skip to content', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
  expect(page.url()).toBe(route)
  await checkAccessibility(page)
  await page.getByRole('radio', { name: /^Employee/ }).check()
  await continueButton(page).click()
  await page.getByRole('button', { name: 'Choose your nationality', exact: true }).click()
  await checkAccessibility(page)
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('button', { name: 'Choose your nationality', exact: true }),
  ).toBeFocused()
})

test('mobile layout, summary disclosure, Arabic direction, and reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('heading', { name: /Your health/ }).waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: '.qa/landing-mobile.png', fullPage: true, animations: 'disabled' })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false)
  await page.getByRole('button', { name: 'Switch to Arabic', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await page.getByRole('heading', { name: /صحتك/ }).waitFor()
  await page.screenshot({
    path: '.qa/landing-arabic-mobile.png',
    fullPage: true,
    animations: 'disabled',
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false)
  await page.getByRole('link', { name: /^أفراد عائلتي فقط/ }).click()
  await page.getByRole('radio', { name: /^مستثمر/ }).check()
  await page.getByRole('button', { name: 'Switch to English', exact: true }).click()
  await expect(page.getByRole('radio', { name: /^Investor/ })).toBeChecked()
  await page.locator('.mobile-summary-trigger').click()
  await expect(page.locator('.cover-summary')).toBeVisible()
  await expect(page.locator('.cover-summary')).toContainText(
    'You are the sponsor and are not included',
  )
  await page.locator('.mobile-summary-trigger').click()
  await expect(page.locator('.cover-summary')).not.toBeVisible()
  await page.screenshot({ path: '.qa/cover-mobile.png', fullPage: true, animations: 'disabled' })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false)
  await enterCover(page, 'Investor')
  await enterApplicant(page, 'pending')
  await page.getByRole('button', { name: 'Parent', exact: true }).click()
  await enterMember(page, 'Parent Example', '1961-01-01', 'Female')
  await page.screenshot({ path: '.qa/family-mobile.png', fullPage: true, animations: 'disabled' })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false)
  await page.getByRole('button', { name: 'Save member', exact: true }).click()
  await page.getByRole('button', { name: 'Add person', exact: true }).click()
  await expect(
    page.getByRole('dialog').getByRole('button', { name: /^Other dependant/ }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Continue to review', exact: true }).click()
  await verifyDemo(page)
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false)
})
