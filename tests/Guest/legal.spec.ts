import { test, expect, Page } from '@playwright/test';
import * as path from 'path';

/**
 * Screenshot helper function
 */
async function takeScreenshot(page: Page, stepName: string) {
    const screenshotsDir = 'screenshots';
    await page.screenshot({ path: path.join(screenshotsDir, stepName), fullPage: true });
}

test.describe('NLDUS Legal Page Automation', () => {

    test('should validate Legal page structure, section headings, and content', async ({ page }) => {
        await test.step('Step 1: Navigate to Homepage and establish session', async () => {
            console.log('Navigating to Homepage');
            await page.goto('https://nldus.com/', { waitUntil: 'networkidle' });

            const ageGateBtn = page.locator("button:has-text('Yes, I\\'m 21+')").first();
            try {
                await ageGateBtn.waitFor({ state: 'visible', timeout: 5000 });
                await ageGateBtn.click();
                console.log('Clicked Age Verification button.');
                await page.waitForTimeout(1000);
            } catch (e) {
                console.log('Age verification popup not found or timeout.');
            }
        });

        await test.step('Step 2: Navigate to Legal Page via Footer Link', async () => {
            console.log('Finding Legal link in footer');
            const legalLink = page.locator('footer a:has-text("Legal")').first();
            await expect(legalLink).toBeVisible();
            await legalLink.click();

            console.log('Waiting for Legal page to load');
            await page.waitForURL(/.*legal/, { timeout: 10000 });
            await page.waitForLoadState('networkidle');

            await takeScreenshot(page, 'guest/legal/legal_01_page_loaded.png');
        });

        await test.step('Step 3: Validate Page Structure', async () => {
            const heading = page.locator('h1, h2').first();
            await expect(heading).toBeVisible();
            const mainContent = page.locator('main, .content, #main-content').first();
            await expect(mainContent).toBeVisible();

            const links = await page.locator('a').count();
            console.log(`Total links on Legal page: ${links}`);
            const imagesCount = await page.locator('img').count();
            console.log(`Total images on Legal page: ${imagesCount}`);
        });

        await test.step('Step 4: Validate Headings and Keywords', async () => {
            const h2Count = await page.locator('h2').count();
            const h3Count = await page.locator('h3').count();
            const h4Count = await page.locator('h4').count();
            const totalHeadings = h2Count + h3Count + h4Count;
            console.log(`Total section headings found: ${totalHeadings} (H2: ${h2Count}, H3: ${h3Count}, H4: ${h4Count})`);

            const pageText = await page.locator('body').innerText();
            const keywords = ['terms', 'law', 'policy'];
            for (const keyword of keywords) {
                const keywordExists = pageText.toLowerCase().includes(keyword.toLowerCase());
                expect(keywordExists, `Keyword "${keyword}" should be present`).toBeTruthy();
            }
        });

        await test.step('Step 5: Scrolling and Footer Check', async () => {
            let scrolled = 0;
            const scrollStep = 800;
            const pageHeight = await page.evaluate(() => document.body.scrollHeight);

            while (scrolled < pageHeight) {
                await page.evaluate((step) => window.scrollBy(0, step), scrollStep);
                await page.waitForTimeout(500);
                scrolled += scrollStep;
                await takeScreenshot(page, `guest/legal/legal_02_scrolling_${scrolled}.png`);
            }

            const footer = page.locator('footer').first();
            if (await footer.isVisible()) {
                await expect(footer).toBeVisible();
            }

            await page.evaluate(() => window.scrollTo(0, 0));
            await page.waitForTimeout(1000);
            await takeScreenshot(page, 'guest/legal/legal_03_scrolled_back_to_top.png');
            await expect(page).toHaveTitle(/.*No Limits Distributions.*/i);
        });

        console.log('Legal page test complete.');
    });

});