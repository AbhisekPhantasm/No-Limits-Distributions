import { test, expect, Page } from '@playwright/test';

async function handleAgeGate(page: Page) {
  const ageGate = page.locator('button:has-text("Yes, I\'m 21+")');
  try {
    if (await ageGate.isVisible()) {
      await ageGate.click();
      await ageGate.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => { });
    } else {
      await ageGate.waitFor({ state: 'visible', timeout: 3000 }).then(async () => {
        await ageGate.click();
        await ageGate.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => { });
      }).catch(() => { });
    }
  } catch (e) { }
}
//TC1
async function login(page: Page) {
  await page.goto('https://nldus.com/login');
  await handleAgeGate(page);
  await page.fill('input#email', 'abhisek+1@phantasm.co.in');
  await page.fill('input#password', '123456');
  await page.click('button:has-text("Sign In")');
  const errorModal = page.locator('button:has-text("Try Again")');
  if (await errorModal.isVisible({ timeout: 5000 })) {
    await errorModal.click();
  }
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

test('Home Page Test Case', async ({ page }) => {
  test.setTimeout(300000);
  await login(page);

  //TC 2
  // Header section - Search box
  const searchBox = page.locator('input[placeholder="Search anything here..."]:visible');

  console.log('Searching for "geek bar"...');
  await searchBox.click();
  await searchBox.fill('geek bar');

  const homeUrl = page.url();
  await page.keyboard.press('Enter');
  await page.waitForFunction((oldUrl) => window.location.href !== oldUrl, homeUrl, { timeout: 5000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/login/home/home_search.png' });
  console.log('Attempting to go back...');
  await page.goBack();
  await page.waitForTimeout(1000);
  if (page.url() !== homeUrl) {
    console.log('goBack failed to trigger, forcing navigation to Home URL');
    await page.goto(homeUrl, { waitUntil: 'networkidle' });
  }
  await searchBox.waitFor({ state: 'visible' });

  // TC 3
  // Join our community
  console.log('Interacting with "Join Our Community" link...');
  // Use a broader selector and filter for better matches
  const communityLink = page.locator('a').filter({ hasText: /Community/i }).first();

  try {
    const count = await communityLink.count();
    console.log(`Found ${count} potential community links.`);

    if (count > 0) {
      // Ensure the link is visible and scroll to it
      console.log('Scrolling to community link...');
      await communityLink.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => console.log('Scroll into view timeout/failed'));

      console.log('Clicking community link and waiting for popup...');
      const [communityPage] = await Promise.all([
        page.waitForEvent('popup', { timeout: 15000 }).catch(() => {
          console.log('No popup appeared within 15s');
          return null;
        }),
        communityLink.click({ force: true }),
      ]);

      if (communityPage) {
        console.log('Community popup opened successfully');
        await communityPage.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);
        await communityPage.screenshot({ path: 'screenshots/login/home/home_community.png' });
        await communityPage.close();
      } else {
        console.log('Checking if it navigated in the same tab...');
        if (!page.url().includes('nldus.com') || page.url().includes('community')) {
          console.log(`Navigated to: ${page.url()}`);
          await page.screenshot({ path: 'screenshots/login/home/home_community_same_tab.png' });
          await page.goBack();
        }
      }
    } else {
      console.log('No "Join Our Community" link found on the page.');
      await page.screenshot({ path: 'screenshots/login/home/home_community_not_found.png' });
    }
  } catch (e: any) {
    console.log(`Error in TC 3: ${e.message}`);
    await page.screenshot({ path: 'screenshots/login/home/home_community_error.png' });
  }



  //TC 4
  // --- RETURN TO HOME FIX ---
  console.log('Returning to Home...');
  // Use a hard reload to ensure the login state and header are fresh
  await page.goto(homeUrl, { waitUntil: 'networkidle' });

  //TC 5
  // --- PROFILE DROPDOWN SECTION ---
  console.log('Locating profile icon...');
  const profileIcon = page.locator('header').locator('text=AbhisekTest').filter({ visible: true }).first();

  try {
    await profileIcon.waitFor({ state: 'visible', timeout: 15000 });
    await profileIcon.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(500);
    await profileIcon.hover({ force: true });
    console.log('Successfully hovered over profile icon');
  } catch (error) {
    console.log('Profile icon not visible in header. Taking debug screenshot.');
    await page.screenshot({ path: 'screenshots/login/home/home_profile_missing.png' });
    await page.reload({ waitUntil: 'networkidle' });
  }
  await profileIcon.hover({ force: true });
  await profileIcon.click({ force: true });
  await page.waitForTimeout(1000);

  const profileMenuLink = page.locator('text="Profile"').first();
  await profileMenuLink.waitFor({ state: 'attached', timeout: 5000 });
  await profileMenuLink.click({ force: true });

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `screenshots/login/home/home_profile_profile.png` });

  //TC-6
  // 2. Now on the Dashboard page, interact with the sidebar items
  const sidebarItems = ['Dashboard', 'Your Orders', 'Saved Address'];
  for (const item of sidebarItems) {
    console.log(`Interacting with sidebar item: ${item}`);
    try {
      const sidebarLink = page.locator(`text=${item}`).first();
      await sidebarLink.waitFor({ state: 'attached', timeout: 5000 });
      await sidebarLink.click({ force: true });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `screenshots/login/home/home_profile_${item.replace(/\s+/g, '_')}.png` });
    } catch (e: any) {
      console.log(`Could not interact with sidebar ${item}: ${e.message}`);
    }
  }

  //TC 7
  // 3. Settings sub-flow -> Change password
  console.log('Navigating to Settings...');
  await profileIcon.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
  await profileIcon.hover({ force: true });
  await profileIcon.click({ force: true });
  await page.waitForTimeout(1000);

  await page.click('text=Settings').catch(() => { });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  await page.click('text=Change password').catch(() => { });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/login/home/home_settings_password.png' });

  // TC 8
  // 4. Sign out
  console.log('Starting Sign Out process...');
  const signOutLocator = page.locator('button:has-text("Sign Out"), a:has-text("Sign Out"), span:has-text("Sign Out")').filter({ visible: true });

  try {
    if (await signOutLocator.first().isVisible({ timeout: 3000 })) {
      console.log('Sign Out button is visible, clicking...');
      await signOutLocator.first().click({ force: true });
    } else {
      console.log('Sign Out button not visible, attempting to open profile menu...');
      await profileIcon.click({ force: true }).catch(() => { });
      await page.waitForTimeout(1000);
      await signOutLocator.first().waitFor({ state: 'visible', timeout: 5000 });
      await signOutLocator.first().click({ force: true });
    }
  } catch (error) {
    console.log('Direct Sign Out click failed, attempting fallback with hover...');
    try {
      await profileIcon.hover({ force: true });
      await page.waitForTimeout(500);
      await signOutLocator.first().click({ force: true });
    } catch (innerError: any) {
      console.log(`Fallback Sign Out failed: ${innerError.message}`);
    }
  }
  console.log('Checking for Sign Out confirmation modal...');
  const confirmBtn = page.locator('button:has-text("Yes, Sign Out"), button:has-text("Sign Out")').filter({ visible: true }).last();

  try {
    if (await confirmBtn.isVisible({ timeout: 5000 })) {
      await confirmBtn.click();
      console.log('Sign out confirmed via modal');
    }
  } catch (e) {
    console.log('Confirmation button not found or modal did not appear');
  }
  await page.waitForURL(url => url.pathname.includes('/login') || url.pathname === '/', { timeout: 15000 }).catch(() => { });
  await page.waitForLoadState('networkidle');

  console.log('Logging back in to verify session can be restored...');
  await login(page);


  //TC 9
  // Shopping Cart
  console.log('Interacting with Shopping Cart...');
  const cartContainer = page.locator('div').filter({ hasText: 'Shopping Cart' }).filter({ has: page.locator('svg') }).first();
  await cartContainer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
  await cartContainer.click({ force: true });
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/login/home/home_cart.png' });
  if (page.url().includes('/cart')) {
    await page.goBack({ waitUntil: 'networkidle' });
  } else {
    await page.reload({ waitUntil: 'networkidle' });
  }

  //TC 10 : Header Navigation Links
  const navLinks = [
    'SHOP',
    'THCA',
    'DISPOSABLES',
    'KRATOM / HYDROXY',
    'NEW ARRIVAL',
    'MUSHROM' // Note: Website spelling
  ];
  for (const linkText of navLinks) {
    console.log(`Navigating to header link: ${linkText}`);
    try {
      const link = page.locator('header').getByText(new RegExp(`^${linkText}$`, 'i')).first();
      await link.waitFor({ state: 'visible', timeout: 5000 });
      await link.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      const safeName = linkText.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      await page.screenshot({ path: `screenshots/login/home/header_nav_${safeName}.png` });
      await page.goto(homeUrl, { waitUntil: 'networkidle' });
    } catch (e: any) {
      console.log(`Failed to navigate to ${linkText}: ${e.message}`);
      await page.goto(homeUrl).catch(() => { });
    }
  }

  // TC 11
  // Click every video, image separately which can be redirected
  console.log('Interacting with media links...');
  await page.goto('/', { waitUntil: 'networkidle' });
  const hrefs = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a:has(img), a:has(video)'));
    return Array.from(new Set(anchors
      .map(a => (a as HTMLAnchorElement).href)
      .filter(href => {
        try {
          const url = new URL(href);
          return url.protocol.startsWith('http') && href !== window.location.href + '#';
        } catch (e) {
          return false;
        }
      })
    )).slice(0, 13);
  });

  console.log(`Found ${hrefs.length} unique valid media links.`);

  for (let i = 0; i < hrefs.length; i++) {
    const href = hrefs[i];
    console.log(`Navigating to media link ${i + 1}/${hrefs.length}: ${href}`);

    try {
      await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForLoadState('networkidle').catch(() => console.log('Timeout waiting for networkidle, continuing...'));
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: `screenshots/login/home/home_media_link_${i}.png`,
        fullPage: false
      }).catch(e => console.log('Screenshot skipped/failed:', e.message));

    } catch (e: any) {
      console.log(`Failed on link ${i} (${href}): ${e.message}`);
    } finally {
      // Return to Home for the next iteration
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }
  }


  //TC 12
  // Scroll
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/login/home/home_scrolled.png' }).catch(e => console.log('Screenshot skipped/failed:', e.message));


  //TC 13
  const copyrightText = page.locator('text=©');
  const currentYear = new Date().getFullYear().toString();

  // Get the text content
  const text = await copyrightText.textContent();

  if (text?.includes(currentYear)) {
    console.log(`✅ Current year (${currentYear}) is present`);
  } else {
    console.log(`❌ Current year (${currentYear}) is NOT present`);
  }
  await expect(copyrightText).toContainText(currentYear);


  //TC 14
  await page.goto('/')
});