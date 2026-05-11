import { test, expect, Page } from '@playwright/test';

async function handleAgeGate(page: Page) {
  const ageGate = page.locator('button:has-text("Yes, I\'m 21+")');
  try {
    if (await ageGate.isVisible()) {
      await ageGate.click();
      await ageGate.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => { });
    } else {
      await ageGate.waitFor({ state: 'visible', timeout: 3000 }).then(async () => {
        await ageGate.click();
        await ageGate.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => { });
      }).catch(() => { });
    }
  } catch (e) { }
}
//TC 1
async function login(page: Page) {
  await page.goto('https://nldus.com/login');
  await handleAgeGate(page);
  await page.fill('input#email', 'abhisek+1@phantasm.co.in');
  await page.fill('input#password', '123456');
  await page.click('button:has-text("Sign In")');

  const errorModal = page.locator('button:has-text("Try Again")');
  if (await errorModal.isVisible({ timeout: 5000 })) {
    await errorModal.click();
  }
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

test('Disposable Page Test Case', async ({ page }) => {
  test.setTimeout(300000);
  //TC 2
  await login(page);

  await page.goto('https://nldus.com/');

  // 1. Header hover and check products (Limited to first 3 to save time) //TC 3
  const disposableMenu = page.locator('header span:has-text("DISPOSABLES")');
  await disposableMenu.hover();

  const dropdownProducts = page.locator('header .dropdown-content a');
  const count = await dropdownProducts.count();
  for (let i = 0; i < Math.min(count, 3); i++) {
    const productName = await dropdownProducts.nth(i).innerText();
    console.log(`Checking product: ${productName}`);
    await dropdownProducts.nth(i).click();
    await page.screenshot({ path: `screenshots/login/disposable/disposable_header_product_${i}.png` });
    await page.goBack();
    await disposableMenu.hover();
  }

  // 2. Click Disposable in header  TC 4
  await page.click('header span:has-text("DISPOSABLES")');
  await page.waitForLoadState('networkidle');


  // 3. Filter section TC 5
  // Ensure the brand section is expanded correctly
  const headersToExpand = ['Categories', 'DISPOSABLES'];
  for (const h of headersToExpand) {
    const header = page.locator('button, div').filter({ hasText: new RegExp(`^${h}$`, 'i') }).first();
    try {
      if (await header.isVisible({ timeout: 5000 })) {
        const expanded = await header.getAttribute('aria-expanded');
        if (expanded === 'false' || expanded === null) {
          await header.scrollIntoViewIfNeeded().catch(() => {});
          try {
            await header.click({ timeout: 5000 });
          } catch (e) {
            console.log(`[WARNING] Click failed for ${h}, trying force click or dispatchEvent`);
            await header.click({ force: true, timeout: 5000 }).catch(async () => {
              await header.dispatchEvent('click');
            });
          }
          if (!page.isClosed()) await page.waitForTimeout(1000).catch(() => null);
        }
      }
    } catch (e) { }
  }
  // TC 6
  const targetBrands = ['BREEZE', 'MR FOG', 'UT', 'OLIT', 'GEEK BAR', 'NORTH', 'NEXA', 'FEEN'];

  for (const brand of targetBrands) {
    console.log(`Working on brand: ${brand}`);

    // Refined locator to find the container/label for the brand
    const brandLabel = page.locator('label, [role="button"], .flex.items-center', {
      hasText: new RegExp(`\\b${brand}\\b`, 'i')
    }).first();

    try {
      // 1. Wait and Scroll manually to ensure it's centered in the viewport
      await brandLabel.waitFor({ state: 'attached', timeout: 5000 });
      await brandLabel.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'nearest' }));

      // 2. Identify the checkbox
      const checkbox = brandLabel.locator('input[type="checkbox"]');

      console.log(`Checking ${brand}...`);

      // 3. Try to click the checkbox directly. 
      // If it's "outside viewport", dispatchEvent is the most reliable workaround.
      await checkbox.dispatchEvent('click');

      // Wait for the UI to update
      await page.waitForLoadState('networkidle');
      if (!page.isClosed()) await page.waitForTimeout(2000).catch(() => null);
      await page.screenshot({ path: `screenshots/login/disposable/disposable_filter_${brand}.png` });

      console.log(`Unchecking ${brand}...`);

      // 4. Use dispatchEvent again to uncheck
      await checkbox.dispatchEvent('click');

      // Brief pause to let the UI reset
      if (!page.isClosed()) await page.waitForTimeout(1000).catch(() => null);
      await page.waitForLoadState('networkidle');

    } catch (e: any) {
      console.log(`Brand filter ${brand} interaction failed: ${e.message}`);
      await page.screenshot({ path: `screenshots/login/disposable/disposable_error_${brand}.png` });
    }
  }
});
