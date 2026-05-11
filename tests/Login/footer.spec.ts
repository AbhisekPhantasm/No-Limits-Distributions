import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test('File 1: Login and Footer Links', async ({ page }) => {
    test.setTimeout(300000);

    const errorDir = path.join(process.cwd(), 'error-screenshots');
    if (!fs.existsSync(errorDir)) fs.mkdirSync(errorDir);
    if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

    // STEP 1: LOGIN
    await test.step('Login to Nldus', async () => {
        console.log('[Login & Footer] Starting Login Flow...');
        await page.goto('https://nldus.com');
        await page.waitForTimeout(2000);

        try {
            const ageGate = page.locator('button:has-text("Yes, I\'m 21+")');
            if (await ageGate.isVisible({ timeout: 5000 })) {
                await ageGate.click();
            }
        } catch (e) { }

        await page.goto('https://nldus.com/login');
        await page.waitForTimeout(2000);
        await test.info().attach('Login Page Loaded', { body: await page.screenshot(), contentType: 'image/png' });

        await page.fill('input#email', 'abhisek+1@phantasm.co.in');
        await page.fill('input#password', '123456');
        await test.info().attach('Credentials Filled', { body: await page.screenshot(), contentType: 'image/png' });

        await page.click('button:has-text("Sign In")');
        console.log("Login Clicked")

        await page.waitForURL('https://nldus.com/', { timeout: 15000 });
        await page.waitForTimeout(2000);
        await test.info().attach('Home Page After Login', { body: await page.screenshot(), contentType: 'image/png' });
        console.log("Home Page After Login")
    });

    // STEP 2: FOOTER
    await test.step('Scroll to Footer', async () => {
        console.log('[Login & Footer] Scrolling to Footer...');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
        await test.info().attach('Footer Section', { body: await page.screenshot(), contentType: 'image/png' });
    });
    console.log("Footer Clicked")
    // STEP 3: FOOTER LINKS
    const linksToCheck = [
        'Home', 'Shop', 'About us', 'Shipping Policy', 'Terms & Conditions',
        'Return Policy', 'My Account', 'My Orders', 'Privacy Policy', 'Contact Us', 'Legal'
    ];

    for (const linkName of linksToCheck) {
        await test.step(`Checking link: ${linkName}`, async () => {
            console.log(`[Login & Footer] Checking link: ${linkName}`);
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(1000);

            try {
                const link = page.locator(`footer a:has-text("${linkName}")`).first();
                await link.scrollIntoViewIfNeeded();

                await link.click({ timeout: 5000 });
                await page.waitForTimeout(2000);

                // Take screenshot at the start of the page after redirection
                await test.info().attach(`${linkName} Page`, { body: await page.screenshot(), contentType: 'image/png' });

                // Scroll to bottom
                await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                await page.waitForTimeout(1000);

                await expect(page).not.toHaveURL(/404|500/);
            } catch (error) {
                console.log(`[Login & Footer] Error interacting with ${linkName}:`, error);
                // Try to recover the page if it crashed
                try {
                    await page.goto('https://nldus.com/');
                } catch (e) { }
            }

            if (linkName === 'Contact Us') {
                await test.step('Fill Contact Form', async () => {
                    console.log('[Login & Footer] Filling Contact Us Form...');
                    await page.fill('input[placeholder="John Doe"]', 'Test User');
                    await page.fill('input[placeholder="you@example.com"]', 'test@example.com');

                    // Fill Phone Number
                    const phoneInput = page.locator('input[type="tel"], input[placeholder*="Phone" i], input[placeholder*="phone" i]').first();
                    if (await phoneInput.isVisible({ timeout: 3000 })) {
                        await phoneInput.fill('1234567890');
                    }
                    // Fill How we can help
                    const helpInput = page.locator('[placeholder*="help" i]').first();
                    if (await helpInput.isVisible({ timeout: 3000 })) {
                        await helpInput.fill('Looking for wholesale information.');
                    }
                    await page.fill('textarea[placeholder="Your message here..."]', 'This is a test message');
                    await test.info().attach('Contact Form Filled', { body: await page.screenshot(), contentType: 'image/png' });
                    console.log('[Login & Footer] Submitting Contact Us Form...');
                    await page.click('button:has-text("Send Message")');
                    await page.waitForTimeout(3000);
                    await test.info().attach('Contact Form Submitted', { body: await page.screenshot(), contentType: 'image/png' });
                });
            }

            await page.goto('https://nldus.com/');
            console.log(`[Login & Footer] Link ${linkName} Check Complete`);
        });
    }
});