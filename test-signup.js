const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 Loading app...');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });

    // Wait for app to fully load
    await page.waitForTimeout(2000);

    // Get current URL to see if we're at home/login
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Look for signup link/button
    console.log('🔍 Looking for signup link...');
    const signupLinks = await page.locator('a:has-text("Créer un compte"), a:has-text("Sign up"), button:has-text("Créer un compte")').all();
    console.log('Found', signupLinks.length, 'signup links');

    if (signupLinks.length === 0) {
      console.log('🔍 Trying to navigate directly to signup...');
      await page.goto('http://localhost:8081/auth/signup', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
    } else {
      console.log('✅ Clicking signup link');
      await signupLinks[0].click();
      await page.waitForTimeout(1000);
    }

    // Screenshot after navigation
    console.log('📸 Taking screenshot of signup page');
    await page.screenshot({ path: 'C:\\Users\\DELL5500\\AppData\\Local\\Temp\\claude\\c--Users-DELL5500-Desktop-nearme\\bb5f5d20-8cdf-4e01-98a8-bbda14370cd3\\scratchpad\\signup-1.png', fullPage: true });

    console.log('Current URL after nav:', page.url());

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
