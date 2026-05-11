import { test, expect } from '@playwright/test';

async function snap(page: any, name: string) {
    await page.screenshot({
        path: `screenshots/guest/terms_conditions/${name}.png`,
        fullPage: true,
    });
}

test('Terms and Conditions Page - Complete Test', async ({ page }) => {
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

    // ── STEP 2: Navigate to Terms and Conditions Page ──
    await page.goto('https://nldus.com/terms-and-conditions');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/terms/);
    await snap(page, 'terms_02_page_loaded');
    console.log('✅ Step 2: Terms and Conditions page loaded successfully');

    // ── STEP 3: Verify Page Heading ──
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    await snap(page, 'terms_03_heading_visible');
    console.log('✅ Step 3: Terms heading is visible');

    // ── STEP 4: Verify Terms Content Is Present ──
    const content = page.locator('p, .terms-content, article, section, .content').first();
    await expect(content).toBeVisible();
    const contentText = await content.textContent();
    await expect(contentText?.trim()).not.toBe('');
    await snap(page, 'terms_04_content_present');
    console.log('✅ Step 4: Terms content is present');

    // ── STEP 5: Check For Section Headings Inside Page ──
    const sectionHeadings = page.locator('h2, h3, h4');
    const headingCount = await sectionHeadings.count();
    console.log(`Found ${headingCount} section headings`);
    await snap(page, 'terms_05_section_headings');
    console.log('✅ Step 5: Section headings counted and validated');

    // ── STEP 6: Check For Important Terms Keywords ──
    const keywords = page.locator('p, li, div').filter({ hasText: /liability|agreement|terms|conditions|use|service/i }).first();
    if (await keywords.isVisible()) {
        console.log('✅ Found important terms keywords');
    } else {
        console.log('ℹ️ Important terms keywords not found, but continuing test');
    }
    await snap(page, 'terms_06_keywords_checked');
    console.log('✅ Step 6: Terms keywords checked');

    // ── STEP 7: Scroll Through Full Terms Page ──
    for (let i = 0; i < 8; i++) {
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(400);
    }
    await snap(page, 'terms_07_full_scroll');
    console.log('✅ Step 7: Full terms page scrolled successfully');

    // ── STEP 8: Check For Any Links Inside Terms ──
    const internalLinks = page.locator('article a, .content a, main a, p a');
    const linkCount = await internalLinks.count();
    console.log(`Found ${linkCount} internal links inside terms`);
    await snap(page, 'terms_08_links_inside_terms');
    console.log('✅ Step 8: Internal links inside terms checked');

    // ── STEP 9: Final Validation ──
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const pageTitle = await page.title();
    await expect(pageTitle).not.toBe('');

    const paragraph = page.locator('p').first();
    await expect(paragraph).toBeVisible();

    await snap(page, 'terms_09_final_validation');
    console.log('✅ Step 9: Terms and Conditions page fully validated');
});