import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';

test.describe('NLDUS Shop Flow - Final Validated Filtering', () => {
    test.describe.configure({ mode: 'serial' });

    test('Sequential Deep Dive for All Categories', async ({ page }) => {
        test.setTimeout(3600000); // 1 hour for full site validation
        await page.setViewportSize({ width: 1920, height: 1080 });

        await allure.suite('NLDUS Full Shop E2E');

        // 1. Initial Navigation
        await allure.step('Navigate to Homepage and Handle Age Gate', async () => {
            await page.goto('https://nldus.com/');
            await page.waitForTimeout(3000);

            const ageGateButton = page.getByRole('button', { name: /21\+/i }).filter({ visible: true }).first();
            if (await ageGateButton.isVisible()) {
                await ageGateButton.click();
                await page.waitForTimeout(2000);
            }
        });

        // 2. Go to Shop
        await allure.step('Navigate to Shop via Header', async () => {
            const shopLink = page.locator('nav').getByRole('link', { name: 'SHOP' }).first();
            await shopLink.click();
            await page.waitForLoadState('networkidle');
            await expect(page).toHaveURL(/.*shop/);
        });

        // 3. Define Categories
        const categoryMap = {
            'DISPOSABLES': 'panel-disposables-header',
            'NEW ARRIVAL': 'panel-new-arrivals-header'
        };

        for (const [catName, headerId] of Object.entries(categoryMap)) {
            await allure.step(`Category: ${catName}`, async () => {
                await page.locator('[class*="shimmer"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });

                const catHeader = page.locator(`#${headerId}`).filter({ visible: true }).first();
                const catCheckbox = catHeader.locator('input[type="checkbox"]').first();

                await allure.step(`Tick and Expand Category: ${catName}`, async () => {
                    await catHeader.evaluate((node) => {
                        node.scrollIntoView({ block: 'center' });
                        window.scrollBy(0, -100);
                    });
                    await page.waitForTimeout(2000);

                    const isChecked = await catCheckbox.isChecked();
                    if (!isChecked) {
                        await catCheckbox.click({ force: true }).catch(() => catCheckbox.dispatchEvent('click'));
                        await page.waitForTimeout(5000);
                        await page.waitForLoadState('networkidle');
                    }

                    if (await catHeader.getAttribute('aria-expanded') !== 'true') {
                        await catHeader.click({ force: true }).catch(() => catHeader.dispatchEvent('click'));
                        await page.waitForTimeout(3000);
                    }
                });

                // 4. Discover Brands
                const brandRegionId = await catHeader.getAttribute('aria-controls');
                const brandRegion = page.locator(`#${brandRegionId}`);

                const brandRows = brandRegion.locator('div, label, span').filter({ has: page.locator('input, [role="checkbox"]') }).filter({ visible: true });
                const rowCount = await brandRows.count();

                const brands = [];
                for (let k = 0; k < rowCount; k++) {
                    const text = (await brandRows.nth(k).innerText()).split('\n')[0].trim();
                    if (text && text.length > 1 && text.toUpperCase() !== catName.toUpperCase()) {
                        brands.push(text);
                    }
                }

                const uniqueBrands = [...new Set(brands)];

                for (const brandName of uniqueBrands) {
                    await allure.step(`Brand: ${brandName}`, async () => {
                        const currentHeader = page.locator(`#${headerId}`).filter({ visible: true }).first();
                        if (await currentHeader.getAttribute('aria-expanded') !== 'true') {
                            await currentHeader.click({ force: true }).catch(() => currentHeader.dispatchEvent('click'));
                            await page.waitForTimeout(2000);
                        }

                        const brandRow = brandRegion.locator('div, label, span')
                            .filter({ hasText: new RegExp(`^${brandName}$`, 'i') })
                            .filter({ has: page.locator('input, [role="checkbox"]') })
                            .last();

                        const checkbox = brandRow.locator('input, [role="checkbox"]').first();

                        await allure.step(`Tick brand: ${brandName}`, async () => {
                            await brandRow.evaluate((node) => {
                                node.scrollIntoView({ block: 'center' });
                                window.scrollBy(0, -100);
                            });
                            await checkbox.click({ force: true }).catch(() => checkbox.dispatchEvent('click'));
                            await page.waitForLoadState('networkidle');
                            await page.waitForTimeout(6000);
                        });

                        // 5. Deep Dive 2 products
                        const productLinks = page.locator('.grid a[href^="/product/"]').filter({ visible: true });
                        const pCount = Math.min(await productLinks.count(), 2);

                        for (let j = 0; j < pCount; j++) {
                            await allure.step(`Deep Dive Product ${j + 1} of ${brandName}`, async () => {
                                const link = productLinks.nth(j);
                                await link.scrollIntoViewIfNeeded().catch(() => { });

                                // --- NEW: Focused Screenshot of the specific product card ---
                                await allure.attachment(`${brandName}_Product_${j + 1}_Target`, await link.screenshot(), 'image/png');

                                await link.click({ force: true }).catch(() => link.dispatchEvent('click'));
                                await page.waitForLoadState('networkidle');

                                // Tabs Interaction
                                await allure.step('Interact with Product Details Tabs', async () => {
                                    const descTab = page.getByRole('tab', { name: /Description/i }).first();
                                    if (await descTab.isVisible()) {
                                        await descTab.click();
                                        await page.waitForTimeout(1000);
                                    }

                                    const infoTab = page.getByRole('tab', { name: /Product Information/i }).first();
                                    if (await infoTab.isVisible()) {
                                        await infoTab.click();
                                        await page.waitForTimeout(1000);
                                    }

                                    const qaTab = page.getByRole('tab', { name: /Q&A/i }).first();
                                    if (await qaTab.isVisible()) {
                                        await qaTab.click();
                                        await page.waitForTimeout(2000);

                                        const qaAccordions = page.locator('div[role="button"]').filter({ hasText: /\+/ });
                                        const qaCount = await qaAccordions.count();
                                        for (let q = 0; q < qaCount; q++) {
                                            await qaAccordions.nth(q).click({ force: true }).catch(() => { });
                                            await page.waitForTimeout(400);
                                        }
                                        await page.waitForTimeout(1000);
                                    }
                                });

                                await allure.attachment(`${brandName}_P${j + 1}_Details`, await page.screenshot({ fullPage: true }), 'image/png');

                                await page.goBack();
                                await page.waitForURL(/.*shop/);
                                await page.waitForLoadState('networkidle');
                                await page.waitForTimeout(5000);

                                try {
                                    const recoveryHeader = page.locator(`#${headerId}`).filter({ visible: true }).first();
                                    if (await recoveryHeader.isVisible({ timeout: 5000 }) && await recoveryHeader.getAttribute('aria-expanded') !== 'true') {
                                        await recoveryHeader.click({ force: true }).catch(() => { });
                                        await page.waitForTimeout(2000);
                                    }
                                } catch (e) { }
                            });
                        }

                        await checkbox.click({ force: true }).catch(() => checkbox.dispatchEvent('click'));
                        await page.waitForTimeout(2000);
                    });
                }

                // UNTICK CATEGORY - Robust cleanup
                if (await catCheckbox.isChecked()) {
                    await catCheckbox.evaluate((node) => {
                        node.scrollIntoView({ block: 'center' });
                        window.scrollBy(0, -100);
                    });
                    await page.waitForTimeout(1000);
                    await catCheckbox.click({ force: true }).catch(() => catCheckbox.dispatchEvent('click'));
                    await page.waitForTimeout(2000);
                }
            });
        }
    });
});