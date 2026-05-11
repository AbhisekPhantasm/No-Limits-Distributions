import { test, expect, Page } from '@playwright/test';
//TC 1
async function handleAgeGate(page: Page) {
  const ageGate = page.locator('button:has-text("Yes, I\'m 21+")');
  try {
    // Wait briefly for the modal to potentially appear
    if (await ageGate.isVisible()) {
      await ageGate.click();
      await ageGate.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => { });
    } else {
      // If not immediately visible, wait a bit
      await ageGate.waitFor({ state: 'visible', timeout: 3000 }).then(async () => {
        await ageGate.click();
        await ageGate.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => { });
      }).catch(() => { });
    }
  } catch (e) { }
}
//TC 2
async function login(page: Page, email = 'abhisek+1@gmail.com', password = '123456') {
  await page.goto('https://nldus.com/login');
  await handleAgeGate(page);
  await page.fill('input#email', email);
  await page.fill('input#password', password);
  await page.click('button:has-text("Sign In")');
  // Wait for navigation or successful login indicator
  await page.waitForURL(/.*dashboard|.*home|.*/);
}

test('Account and Login Flow', async ({ page }) => {
  await page.goto('https://nldus.com/');
  await handleAgeGate(page);

  // (This is Invalid case) TC 3
  await page.goto('https://nldus.com/login');
  await handleAgeGate(page);
  await page.fill('input#email', 'sameer@gmail.com');
  await page.fill('input#password', '123456');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(1500);
  //TC 4
  await page.screenshot({ path: 'screenshots/login/auth/invalid_login.png' });
  // Handle the "Login Failed" modal if it appears, then reload to clear fields
  await page.click('button:has-text("Try Again")').catch(() => { });
  await page.goto('https://nldus.com/login');
  await handleAgeGate(page);


  // (This is Valid case) TC 5
  await page.fill('input#email', 'abhisek+1@phantasm.co.in');
  await page.fill('input#password', '123456');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(1500);
  //TC 6
  await page.screenshot({ path: 'screenshots/login/auth/valid_login.png' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/login/auth/home_page.png' });
});
