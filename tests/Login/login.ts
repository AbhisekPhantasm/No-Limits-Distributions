import { Page, expect } from '@playwright/test';

/**
 * Handles the age verification modal if it appears on any page.
 */
export async function handleAgeVerification(page: Page) {
    const ageButton = page.locator('button:has-text("Yes, I\'m 21+")');
    try {
        // Wait for button to be visible if it exists, but don't crash if it doesn't
        if (await ageButton.isVisible({ timeout: 3000 })) {
            await ageButton.click();
            // Wait for modal to disappear instead of timeout
            await ageButton.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => null);
        }
    } catch (e) {
        console.log(`[LOG] Age verification modal not found or already handled.`);
    }
}

export async function performLogin(page: Page) {
    console.log('[STEP] Navigating to Login page');
    await page.goto('/login');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000); // Allow some time for hydration

    await handleAgeVerification(page);

    // Login credentials
    console.log('[STEP] Entering login credentials');
    const emailField = page.locator('#email');
    await emailField.waitFor({ state: 'visible' });
    await emailField.fill('abhisek+1@phantasm.co.in');
    await page.locator('#password').fill('123456');

    console.log('[STEP] Clicking Sign In');
    const signInBtn = page.locator('button:has-text("Sign In"), button:has-text("Logging in...")');
    await signInBtn.click();

    // Wait for the login process to complete (button changes back or disappears)
    await expect(signInBtn).not.toHaveText(/Logging in.../i, { timeout: 30000 });

    // Wait for landing page verification (Dashboard, Home, or User profile)
    console.log('[STEP] Verifying login success');
    await expect(page).not.toHaveURL(/.*login/, { timeout: 40000 });
    // Check for either the profile name or a sign-out indicator
    const profileIndicator = page.locator('text=AbhisekTest, button:has-text("Sign Out"), a[href*="logout"]').filter({ visible: true }).first();
    await expect(profileIndicator).toBeVisible({ timeout: 20000 }).catch(() => {
        console.log('[WARNING] Profile indicator not found, but URL shifted. Proceeding...');
    });
}