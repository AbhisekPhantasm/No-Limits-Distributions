import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
test('File 2: My Account Full Journey', async ({ page }) => {
    test.setTimeout(600000);
    const errorDir = path.join(process.cwd(), 'error-screenshots');
    if (!fs.existsSync(errorDir)) fs.mkdirSync(errorDir);
    if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');
    // 1. LOGIN
    await test.step('Login to Account', async () => {
        console.log('[Account] Starting Login Flow...');
        await page.goto('https://nldus.com/login');
        try {
            const ageGate = page.locator('button:has-text("Yes, I\'m 21+")');
            if (await ageGate.isVisible({ timeout: 5000 })) await ageGate.click();
        } catch (e) { }
        await test.info().attach('Login Page Loaded', { body: await page.screenshot(), contentType: 'image/png' });

        await page.fill('input#email', 'abhisek+1@phantasm.co.in');
        await page.fill('input#password', '123456');
        await test.info().attach('Credentials Filled', { body: await page.screenshot(), contentType: 'image/png' });

        await page.click('button:has-text("Sign In")');
        await page.waitForURL('https://nldus.com/', { timeout: 15000 });
        await page.waitForTimeout(2000);
        await test.info().attach('Login Success', { body: await page.screenshot(), contentType: 'image/png' });
        console.log('[Account] Login Successful');
    });
    // 2. DASHBOARD
    await test.step('Go to Dashboard', async () => {
        console.log('[Account] Navigating to Dashboard...');
        await page.click('footer a[href="/profile"]');
        await page.waitForTimeout(2000);
        await page.click('a[href="/profile/dashboard"]');
        await page.waitForTimeout(1000);
        await test.info().attach('Dashboard Page', { body: await page.screenshot(), contentType: 'image/png' });
    });
    // 3. ORDERS & PAYMENT
    await test.step('Orders and Payment Flow', async () => {
        console.log('[Account] Navigating to Orders...');
        await page.click('a[href="/profile/orders"]');
        await page.waitForTimeout(2000);
        await test.info().attach('Orders Page', { body: await page.screenshot(), contentType: 'image/png' });
        const checkboxes = page.locator('input[type="checkbox"]');
        const numCheckboxes = await checkboxes.count();
        const iterations = Math.min(numCheckboxes, 2);

        for (let i = 0; i < iterations; i++) {
            await test.step(`Iteration ${i + 1}: ${i === 0 ? 'No Card Details' : 'Dummy Card Details'}`, async () => {
                console.log(`[Account] Starting Payment Iteration ${i + 1}...`);
                if (i > 0) {
                    await page.goto('https://nldus.com/profile/orders');
                    await page.waitForTimeout(2000);
                    await test.info().attach('Back to Orders', { body: await page.screenshot(), contentType: 'image/png' });
                }

                // Check the i-th checkbox
                await page.locator('input[type="checkbox"]').nth(i).check();
                await test.info().attach(`Order ${i + 1} Selected`, { body: await page.screenshot(), contentType: 'image/png' });

                await page.locator('button:has-text("Pay Invoice")').click();
                await page.waitForTimeout(2000);
                await test.info().attach(`Pay Invoice ${i + 1} Clicked`, { body: await page.screenshot(), contentType: 'image/png' });

                await page.locator('button:has-text("Proceed to payment"), button:has-text("Pay Now")').first().click();
                await page.waitForTimeout(3000);
                await test.info().attach(`Proceed to Payment ${i + 1}`, { body: await page.screenshot(), contentType: 'image/png' });

                await page.evaluate(() => window.scrollBy(0, 500));

                // For the second iteration, fill in card details
                if (i === 1) {
                    const cardNum = page.getByPlaceholder('Card Number');
                    if (await cardNum.isVisible({ timeout: 5000 })) {
                        console.log('[Account] Filling dummy card details...');
                        await cardNum.fill('4242 4242 4242 4242');
                        await page.getByPlaceholder('MM/YY').fill('12/25');
                        await page.getByPlaceholder('CVV').fill('123');
                        await test.info().attach('Card Details Filled', { body: await page.screenshot(), contentType: 'image/png' });
                    }
                }

                console.log(`[Account] Submitting Payment ${i + 1}...`);
                await page.locator('button:has-text("Pay Now"), button:has-text("Complete Payment")').first().click();
                await page.waitForTimeout(4000); // Wait for processing or modal
                await test.info().attach(`Payment Attempt ${i + 1}`, { body: await page.screenshot(), contentType: 'image/png' });

                const continueBtn = page.locator('button:has-text("Continue")');
                if (await continueBtn.isVisible({ timeout: 5000 })) {
                    await continueBtn.click();
                    await page.waitForTimeout(2000);
                    await test.info().attach(`Modal ${i + 1} Closed`, { body: await page.screenshot(), contentType: 'image/png' });
                    console.log(`[Account] Payment ${i + 1} Modal Closed`);
                }
            });
        }
    });
    // 4. ADDRESS
    await test.step('Edit Saved Address', async () => {
        console.log('[Account] Navigating to Address Section...');
        await page.goto('https://nldus.com/profile/address');
        await page.waitForTimeout(3000);
        const editBtn = page.locator('button:has-text("Edit Addresses")');
        if (await editBtn.isVisible()) {
            console.log('[Account] Editing Address Name...');
            await editBtn.click();
            await page.waitForTimeout(2000);
            const modalInputs = page.locator('.fixed input.w-full');
            await modalInputs.nth(0).clear();
            await modalInputs.nth(0).fill('John');
            await modalInputs.nth(1).clear();
            await modalInputs.nth(1).fill('Doe');
            await test.info().attach('Address Name Edited', { body: await page.screenshot(), contentType: 'image/png' });

            await page.locator('button:has-text("Update Address")').click();
            await page.waitForTimeout(3000);
            await test.info().attach('Address Saved', { body: await page.screenshot(), contentType: 'image/png' });
            console.log('[Account] Address Saved Successfully');
        }
    });
    // 5. PASSWORD & SIGNOUT
    await test.step('Sign Out', async () => {
        console.log('[Account] Navigating to Sign Out...');
        await page.goto('https://nldus.com/profile/change-password');
        await page.waitForTimeout(2000);
        await test.info().attach('Change Password Page', { body: await page.screenshot(), contentType: 'image/png' });

        const signOutBtn = page.locator('button:has-text("Sign Out")').first();
        await signOutBtn.click();
        await page.waitForTimeout(3000);
        await test.info().attach('Sign Out Success', { body: await page.screenshot(), contentType: 'image/png' });
        console.log('[Account] Sign Out Complete');
    });
});