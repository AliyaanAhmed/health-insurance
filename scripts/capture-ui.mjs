import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
await mkdir('.qa', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } })
  const errors = []
  const consoleErrors = []
  const failedRequests = []
  const httpErrors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) =>
    failedRequests.push({ url: request.url(), error: request.failure()?.errorText }),
  )
  page.on('response', (response) => {
    if (response.status() >= 400)
      httpErrors.push({ url: response.url(), status: response.status() })
  })
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: /Your health/ }).waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(
    () => getComputedStyle(document.querySelector('.hero-copy')).opacity === '1',
  )
  await page.screenshot({ path: '.qa/landing-desktop.png', fullPage: true, animations: 'disabled' })
  await page.getByRole('link', { name: /Me & my dependents/ }).click()
  await page.getByRole('heading', { name: /Which visa/ }).waitFor()
  await page.waitForFunction(
    () => getComputedStyle(document.querySelector('.editor-surface')).opacity === '1',
  )
  await page.screenshot({ path: '.qa/cover-desktop.png', fullPage: true, animations: 'disabled' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: '.qa/cover-mobile.png', fullPage: true, animations: 'disabled' })
  await page.getByRole('link', { name: 'InsureAI Health', exact: true }).click()
  await page.getByRole('heading', { name: /Your health/ }).waitFor()
  await page.waitForFunction(
    () => getComputedStyle(document.querySelector('.hero-copy')).opacity === '1',
  )
  await page.screenshot({ path: '.qa/landing-mobile.png', fullPage: true, animations: 'disabled' })
  console.log(
    JSON.stringify({
      errors,
      consoleErrors,
      failedRequests,
      httpErrors,
      overflow: await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    }),
  )
} finally {
  await browser.close()
}
