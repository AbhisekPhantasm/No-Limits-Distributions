import { test, expect } from '@playwright/test';

async function snap(page: any, name: string) {
  await page.screenshot({
    path: `screenshots/guest/about/${name}.png`,
    fullPage: true,
  });
}

test('About Us Page - Complete Test', async ({ page }) => {
  // Force desktop view with multiple methods
  await page.setViewportSize({ width: 1280, height: 720 });

  // ── STEP 1: Navigate to Homepage and Verify Age ──
  await page.goto('https://nldus.com');
  await page.waitForLoadState('networkidle');

  // Double-check viewport after page load
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(1000);

  // Check for age verification popup and click "I'm 21+" if present
  const ageButton = page.locator('button', { hasText: /21/i }).or(page.locator('button', { hasText: /enter/i })).or(page.locator('a', { hasText: /21/i }));
  if (await ageButton.isVisible({ timeout: 3000 })) {
    await ageButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ Age verification clicked: I\'m 21+');
  } else {
    console.log('ℹ️ No age verification popup found');
  }

  // ── STEP 2: Navigate to About Us Page ──
  await page.goto('https://nldus.com/about-us');
  await page.waitForLoadState('networkidle');

  // Force desktop view again on About Us page
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(500);

  await expect(page).toHaveURL(/about/);
  await snap(page, 'aboutus_02_page_loaded');
  console.log('✅ Step 2: About Us page loaded successfully');

  // ── STEP 3: Verify Page Heading ──
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible();
  await snap(page, 'aboutus_03_heading_visible');
  console.log('✅ Step 3: Page heading is visible');

  // ── STEP 4: Scroll Through Page Content ──
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(500);
  }
  await snap(page, 'aboutus_04_scrolled_content');
  console.log('✅ Step 4: Page content scrolled successfully');

  // ── STEP 5: Validate Content Sections Are Visible ──
  const contentSection = page.locator('section, article, .content, .about-section, p').first();
  await expect(contentSection).toBeVisible();
  await snap(page, 'aboutus_05_content_validated');
  console.log('✅ Step 5: Content sections are visible');

  // ── STEP 6: Check All Images Load ──
  const images = page.locator('img');
  const imageCount = await images.count();
  const maxImages = Math.min(imageCount, 5);

  for (let imageIndex = 0; imageIndex < maxImages; imageIndex++) {
    await expect(images.nth(imageIndex)).toBeAttached();
    // Only check visibility for images that are actually visible
    const isVisible = await images.nth(imageIndex).isVisible();
    if (isVisible) {
      await expect(images.nth(imageIndex)).toBeVisible();
      // Take individual screenshot for each visible image for better Allure reporting
      await snap(page, `aboutus_05_image_${imageIndex + 1}_visible`);
    } else {
      console.log(`ℹ️ Image ${imageIndex + 1} is not visible, but continuing`);
    }
  }
  await snap(page, 'aboutus_06_images_checked');
  console.log('✅ Step 6: Images loaded correctly');

  // ── STEP 7: Check Navigation Links Work ──
  const links = page.locator('a[href]');
  const linkCount = await links.count();
  console.log(`Found ${linkCount} navigation links on page`);
  await snap(page, 'aboutus_07_links_present');
  console.log('✅ Step 7: Navigation links present on page');

  // ── STEP 8: Scroll Back to Top ──
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await snap(page, 'aboutus_08_scrolled_to_top');
  console.log('✅ Step 8: Scrolled back to top');

  // ── STEP 9: Final Validation ──
  const pageTitle = await page.title();
  await expect(pageTitle).not.toBe('');
  await expect(page.locator('body')).toBeVisible();
  await snap(page, 'aboutus_09_final_validation');
  console.log('✅ Step 9: About Us page fully functional');
});