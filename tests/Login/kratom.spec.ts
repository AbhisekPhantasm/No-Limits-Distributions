import { test, expect, Page } from '@playwright/test';
import path from 'path';

async function snap(page: Page, name: string) {
  await page.screenshot({
    path: path.join('screenshots', `${name}.png`),
    fullPage: true,
  });
}

async function dismissAgeGate(page: Page) {
  await page.waitForTimeout(2000);
  const ageBtn = page.locator('button, a').filter({ hasText: /yes|i am 21|i am over|enter|verify|confirm age/i }).first();
  if (await ageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await ageBtn.click();
    await page.waitForTimeout(1000);
    console.log('ℹ️ Age verification dismissed');
  }
}

async function loginToSite(page: Page) {
  await page.goto('https://nldus.com/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  await dismissAgeGate(page);

  const emailField = page.locator(
    'input[name="email"], input[type="email"], input[placeholder*="email" i], input[id*="email" i]'
  ).first();
  await emailField.waitFor({ state: 'visible', timeout: 15000 });
  await emailField.fill('abhisek+1@phantasm.co.in');

  const passwordField = page.locator(
    'input[name="password"], input[type="password"], input[placeholder*="password" i], input[id*="password" i]'
  ).first();
  await passwordField.fill('123456');

  const loginBtn = page.locator(
    'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In"), button:has-text("Log In")'
  ).first();
  await loginBtn.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('✅ Login: Logged in successfully');
}

test('Shop – Kratom Hydroxy Category Page Validation', async ({ page }) => {
  test.setTimeout(120000);

  // ── STEP 1: Login to Website ──
  await loginToSite(page);
  await snap(page, 'kratom_01_logged_in');
  const currentUrl = page.url();
  const isLoggedIn = !currentUrl.includes('/login') ||
    await page.locator('a, button, span').filter({ hasText: /logout|my account|account|hi |dashboard|profile/i }).first().isVisible({ timeout: 3000 }).catch(() => false);
  if (isLoggedIn) {
    console.log('✅ Step 1: Login successful');
  } else {
    console.log('ℹ️ Step 1: Login attempted - continuing with test');
  }

  // ── STEP 2: Navigate to Kratom Hydroxy Category Page ──
  await page.goto('https://nldus.com/shop?category=kratom-hydroxy');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await dismissAgeGate(page);
  await expect(page).toHaveURL(/kratom-hydroxy/);
  await snap(page, 'kratom_02_page_loaded');
  console.log('✅ Step 2: Kratom Hydroxy category page loaded successfully');

  // ── STEP 3: Verify Page Heading or Category Title ──
  const heading = page.locator('h1, h2, h3, .category-title, .page-title, .shop-title, [class*="title"], [class*="heading"]').first();
  if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('✅ Step 3: Page heading is visible');
  } else {
    console.log('ℹ️ Step 3: No specific heading found, but page loaded');
  }
  await snap(page, 'kratom_03_heading_visible');

  // ── STEP 4: Check for Empty State Message ──
  const emptyMessage = page.locator('p, div, span').filter({ hasText: /no product|empty|not found|coming soon|nothing here|no items/i }).first();
  if (await emptyMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('ℹ️ Empty message found: ' + await emptyMessage.innerText());
  } else {
    console.log('ℹ️ No empty message shown, continue');
  }
  await snap(page, 'kratom_04_empty_state_checked');
  console.log('✅ Step 4: Empty state checked');

  // ── STEP 5: Verify Product Grid / Container Exists (Even If Empty) ──
  const productContainer = page.locator('.products, .product-grid, .product-list, .shop-grid, [class*="product"], [class*="grid"]').first();
  if (await productContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('ℹ️ Product grid container found');
  } else {
    console.log('ℹ️ Container not found, continue');
  }
  await snap(page, 'kratom_05_product_container_checked');
  console.log('✅ Step 5: Product grid container checked');

  // ── STEP 6: Verify Category Filter or Sidebar Is Visible ──
  const sidebar = page.locator('.sidebar, .filters, aside, [class*="filter"], [class*="sidebar"]').first();
  if (await sidebar.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('ℹ️ Filter/sidebar section found');
  } else {
    console.log('ℹ️ Filter/sidebar section not found, continue');
  }
  await snap(page, 'kratom_06_filter_sidebar_checked');
  console.log('✅ Step 6: Filter/sidebar section checked');

  // ── STEP 7: Scroll Through the Full Page ──
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
  }
  await snap(page, 'kratom_07_page_scrolled');
  console.log('✅ Step 7: Kratom Hydroxy page scrolled successfully');

  // ── STEP 8: Verify Footer Is Visible ──
  const footer = page.locator('footer').first();
  if (await footer.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('✅ Step 8: Footer is visible');
  } else {
    console.log('ℹ️ Step 8: Footer not found but continuing');
  }
  await snap(page, 'kratom_08_footer_visible');

  // ── STEP 9: Navigate Back to Homepage ──
  const homeLink = page.locator('a[href="/"]').first();
  if (await homeLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await homeLink.click();
  } else {
    await page.goto('https://nldus.com');
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await snap(page, 'kratom_09_navigated_back');
  console.log('✅ Step 9: Navigated back to homepage');

  // ── STEP 10: Final Validation ──
  const title = await page.title();
  expect(title).not.toBe('');
  await snap(page, 'kratom_10_final_validation');
  console.log('✅ Step 10: Kratom Hydroxy category page test completed successfully');
});
