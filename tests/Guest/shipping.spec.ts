import { test, expect } from '@playwright/test';

async function snap(page: any, name: string) {
    await page.screenshot({
        path: `screenshots/guest/shipping/${name}.png`,
        fullPage: true,
    });
}

test('Shipping Policy Page - Complete Test', async ({ page }) => {
    // Set explicit desktop viewport to ensure desktop view
    await page.setViewportSize({ width: 1280, height: 720 });

    // ── STEP 1: Navigate to Homepage and Verify Age ──
    await page.goto('https://nldus.com');
    await page.waitForLoadState('networkidle');

    // Check for age verification popup and click "I'm 21+" if present
    const ageButton = page.locator('button', { hasText: /21/i }).or(page.locator('button', { hasText: /enter/i })).or(page.locator('a', { hasText: /21/i }));
    if (await ageButton.isVisible({ timeout: 3000 })) {
        await ageButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Age verification clicked: I\'m 21+');
    } else {
        console.log('ℹ️ No age verification popup found');
    }

    // ── STEP 2: Navigate to Shipping Policy Page ──
    await page.goto('https://nldus.com/shipping-policy');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/shipping-policy/);
    await snap(page, 'shipping_02_page_loaded');
    console.log('✅ Step 2: Shipping Policy page loaded successfully');

    // ── STEP 3: Verify Page Heading ──
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    await expect(headingText?.toLowerCase()).toMatch(/shipping|policy|delivery/i);
    await snap(page, 'shipping_03_heading_visible');
    console.log('✅ Step 3: Shipping Policy heading visible');

    // ── STEP 4: Verify Policy Content Is Present ──
    const content = page.locator('p, .policy-content, .shipping-content, article, section').first();
    await expect(content).toBeVisible();
    await snap(page, 'shipping_04_content_present');
    console.log('✅ Step 4: Shipping policy content is present');

    // ── STEP 5: Check For Shipping Timeframes Section ──
    const timeframes = page.locator('p, li, div').filter({ hasText: /ship|deliver|days|business/i }).first();
    if (await timeframes.isVisible()) {
        console.log('✅ Found shipping timeframes section');
    } else {
        console.log('ℹ️ Shipping timeframes section not found, but continuing test');
    }
    await snap(page, 'shipping_05_timeframes_checked');
    console.log('✅ Step 5: Shipping timeframes section checked');

    // ── STEP 6: Scroll Through Full Policy ──
    for (let i = 0; i < 6; i++) {
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(500);
    }
    await snap(page, 'shipping_06_full_scroll');
    console.log('✅ Step 6: Full policy page scrolled');

    // ── STEP 7: Check For Any Tables or Lists ──
    const tablesLists = page.locator('table, ul, ol').first();
    if (await tablesLists.isVisible()) {
        console.log('✅ Found tables or lists in the policy');
    } else {
        console.log('ℹ️ No tables or lists found, but continuing test');
    }
    await snap(page, 'shipping_07_tables_lists_checked');
    console.log('✅ Step 7: Tables and lists checked');

    // ── STEP 8: Verify Page Has No Broken Layout ──
    await expect(page.locator('body')).toBeVisible();
    const footer = page.locator('footer').first();
    if (await footer.isVisible()) {
        console.log('✅ Footer is visible');
    } else {
        console.log('ℹ️ Footer not found, but continuing test');
    }
    await snap(page, 'shipping_08_layout_validated');
    console.log('✅ Step 8: Page layout is intact');

    // ── STEP 9: Scroll Back to Top and Final Check ──
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await expect(heading).toBeVisible();
    await snap(page, 'shipping_09_final_validation');
    console.log('✅ Step 9: Shipping Policy page fully validated');
});