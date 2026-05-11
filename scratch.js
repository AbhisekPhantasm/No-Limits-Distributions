const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://nldus.com/login');
  try {
    const ageGate = page.locator('button:has-text("Yes, I\'m 21+")');
    if (await ageGate.isVisible({ timeout: 5000 })) await ageGate.click();
  } catch(e){}
  await page.fill('input#email', 'abhisek+1@phantasm.co.in');
  await page.fill('input#password', '123456');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  const profileIcon = page.locator('text="AbhisekTest"').first();
  await profileIcon.waitFor({ state: 'visible', timeout: 10000 });
  await profileIcon.click();
  await page.waitForTimeout(1000);
  const allText = await page.evaluate(() => document.body.innerText);
  console.log("TEXT_START");
  console.log(allText);
  console.log("TEXT_END");
  await browser.close();
})();
