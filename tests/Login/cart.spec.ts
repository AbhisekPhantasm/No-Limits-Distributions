import { test, expect, Page } from '@playwright/test';
import { handleAgeVerification, performLogin } from './login.ts';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Senior QA Automation Engineer - Improved & Stabilized Cart Flow
 */

const log = (step: string) => console.log(`[STEP] ${step}`);

const screenshotDir = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
}


async function takeScreenshot(page: Page, name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${name}-${timestamp}.png`;
    const filePath = path.join(screenshotDir, fileName);
    await page.screenshot({ path: filePath, fullPage: true });
    log(`Screenshot saved: ${fileName}`);
}

async function safeClick(locator: any, name: string) {
    try {
        log(`Clicking ${name}`);
        await locator.click({ timeout: 8000, force: true });
    } catch (e) {
        log(`[WARNING] Force click failed for ${name}, trying dispatchEvent('click')`);
        await locator.dispatchEvent('click');
    }
}

async function handlePageLoad(page: Page, name: string) {
    log(`Waiting for page load: ${name}`);
    await page.waitForLoadState('load');
    await page.waitForLoadState('networkidle').catch(() => null);
    await handleAgeVerification(page);
    await page.waitForTimeout(1000);

    // Check if page is empty
    const bodyContent = await page.locator('body').innerText();
    if (bodyContent.length < 1000) {
        log(`[WARNING] Page ${name} seems empty. Reloading...`);
        await page.reload();
        await page.waitForLoadState('networkidle').catch(() => null);
        await handleAgeVerification(page);
    }

    await takeScreenshot(page, `after-load-${name}`);
}

test('Cart Page - Production-Ready QA Validation', async ({ page }) => {
    test.setTimeout(240000);

    await performLogin(page);
    log('Opening Cart page');
    await page.goto('/cart');
    await handlePageLoad(page, 'cart-initial');

    await expect(page).toHaveURL(/.*cart/);

    const cartItems = page.locator('button:has-text("Remove"), button[title*="Remove"]').filter({ visible: true });
    const loadingIndicator = page.locator('text=/Loading cart items/i');

    await loadingIndicator.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => null);

    if (await cartItems.count() === 0) {
        log('Cart is empty. Refilling...');
        await page.goto('/shop');
        await handlePageLoad(page, 'shop-refill');

        const products = page.locator('.grid > div.relative, .grid > div:has(button:has-text("ADD TO CART"))').filter({ visible: true });
        for (let i = 0; i < 2; i++) {
            log(`Adding product #${i + 1}`);
            await safeClick(products.nth(i), 'product card');
            await handlePageLoad(page, `product-refill-${i}`);

            const plusBtn = page.locator('button:has-text("+")').first();
            if (await plusBtn.isVisible({ timeout: 3000 })) {
                await safeClick(plusBtn, 'quantity increase');
            }

            const addToCartBtn = page.locator('button:has-text("Add to Cart"), button:has-text("ADD TO CART"), button:has-text("Add all to cart")').filter({ visible: true }).first();
            await safeClick(addToCartBtn, 'add to cart button');

            log('Waiting for add to cart response');
            await page.waitForResponse(response => response.status() === 200 || response.status() === 201).catch(() => null);
            await page.waitForTimeout(2000);

            await takeScreenshot(page, `added-to-cart-${i}`);
            await page.goto('/shop');
            await handlePageLoad(page, 'shop-back');
        }
        await page.goto('/cart');
        await handlePageLoad(page, 'cart-refilled');
    }

    const finalItemCount = await cartItems.count();
    log(`Verified ${finalItemCount} products in cart`);
    expect(finalItemCount).toBeGreaterThan(0);

    log('Testing Quantity Update');
    // More robust subtotal locator: find any element containing "Subtotal" and look for a price nearby
    const subtotalLocator = page.locator('div, span, td, p').filter({ hasText: /\$\d+\.\d{2}/ }).filter({ hasText: /Subtotal/i }).first().or(
        page.locator('.subtotal, [class*="subtotal"]').filter({ hasText: /\$/ }).first()
    );

    await subtotalLocator.waitFor({ state: 'attached', timeout: 15000 }).catch(() => null);
    const initialSubtotal = (await subtotalLocator.textContent() || '').trim();
    log(`Initial subtotal: ${initialSubtotal}`);

    const increaseBtn = page.locator('button:has-text("+")').filter({ visible: true }).first();
    if (await increaseBtn.isVisible()) {
        await safeClick(increaseBtn, 'increase quantity');
        await expect(async () => {
            const currentSubtotal = await subtotalLocator.textContent();
            expect(currentSubtotal).not.toBe(initialSubtotal);
        }).toPass({ timeout: 15000 });
        log(`✅ Quantity update verified: ${await subtotalLocator.textContent()}`);
    }

    log('Testing Persistence (Refresh)');
    await page.reload();
    await handlePageLoad(page, 'cart-after-refresh');
    await expect(cartItems.first()).toBeVisible();
    log('✅ Cart persistence validated');

    log('Testing Checkout Flow (Information -> Shipping -> Payment)');
    // 1. Click Proceed to Checkout
    const proceedToCheckoutBtn = page.locator('button:has-text("Proceed to Checkout"), a:has-text("Proceed to Checkout")').first();
    await safeClick(proceedToCheckoutBtn, 'Proceed to Checkout button');

    // Wait for the Information page to load
    await page.waitForURL(/.*information/, { timeout: 15000 });
    await handlePageLoad(page, 'information-page');

    // 2. Fill checkout details using verified selectors
    log('Filling checkout information details');
    await page.locator('input[data-field="firstName"]').fill('John');
    await page.locator('input[data-field="lastName"]').fill('Doe');
    await page.locator('input').nth(4).fill('My Company'); // Company Name (5th input)

    const addressInput = page.locator('input[placeholder="Enter address"]');
    await addressInput.fill('1049 Industrial Dr, Bensenville, IL 60106, USA');
    await page.waitForTimeout(1000); // Wait for autocomplete/rendering

    await page.locator('input[placeholder="address address address"]').fill('Suite 100');
    await page.locator('input[data-field="city"]').fill('Bensenville');
    await page.locator('input[data-field="state"]').fill('IL');
    await page.locator('input[data-field="postcode"]').fill('60106');
    await page.locator('input[data-field="phone"]').fill('1010101010');

    // Take a screenshot of the filled form
    await takeScreenshot(page, 'information-form-filled');

    // 3. Click Continue to Shipping
    const continueToShippingBtn = page.locator('button:has-text("Continue to Shipping")');
    await safeClick(continueToShippingBtn, 'Continue to Shipping button');

    // Wait for checkout page (Shipping step)
    await page.waitForURL(/.*checkout/, { timeout: 15000 });
    await handlePageLoad(page, 'shipping-step');

    // Ensure "Continue to payment" button is visible and click it
    const continueToPaymentBtn = page.locator('button:has-text("Continue to payment")');
    await expect(continueToPaymentBtn).toBeVisible({ timeout: 15000 });
    await safeClick(continueToPaymentBtn, 'Continue to payment button');

    // 4. Verify we successfully reached the Payment page
    await page.waitForURL(/.*payment/, { timeout: 15000 });
    await handlePageLoad(page, 'payment-page');

    // Verify Payment page contains "Payment" header or indicator
    const paymentsHeader = page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: /Payment/i }).or(page.getByText(/Payment/i)).filter({ visible: true }).first();
    await expect(paymentsHeader).toBeVisible({ timeout: 15000 });
    log('✅ Successfully reached Payment page (Checkout Flow Verified)');

    // 5. Navigate back to cart page to complete rest of test
    log('Navigating back to cart');
    await page.goto('/cart');
    await handlePageLoad(page, 'cart-resumed');

    log('Testing Product Removal');
    const countBefore = await cartItems.count();
    await safeClick(cartItems.first(), 'remove button');

    await expect(async () => {
        const currentCount = await cartItems.count();
        expect(currentCount).toBe(countBefore - 1);
    }).toPass({ timeout: 10000 });
    log('✅ Removal verified');

    log('Cart flow completed successfully');
});