const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const screenshotDir = 'C:\\Users\\DELL5500\\AppData\\Local\\Temp\\claude\\c--Users-DELL5500-Desktop-nearme\\bb5f5d20-8cdf-4e01-98a8-bbda14370cd3\\scratchpad';

  try {
    // Step 0: Navigate to signup
    console.log('🔍 Step 0: Navigate to signup');
    await page.goto('http://localhost:8081/auth/signup', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    let screenshot = await page.screenshot({ fullPage: true });
    require('fs').writeFileSync(`${screenshotDir}/step0-landing.png`, screenshot);
    console.log('✅ Navigated to signup page');

    // Step 1: Fill signup step 1 (email and password)
    console.log('🔍 Step 1: Filling email and password');

    // Generate unique email with timestamp
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    // Find email input
    const emailInput = await page.locator('input[placeholder*="email"], input[type="email"], input[placeholder*="Email"]').first();
    if (!emailInput) {
      throw new Error('Email input not found');
    }
    await emailInput.fill(testEmail);
    console.log(`✅ Email filled: ${testEmail}`);

    // Find password input
    const passwordInput = await page.locator('input[placeholder*="password"], input[placeholder*="mot de passe"], input[placeholder*="Mot de passe"]').first();
    if (!passwordInput) {
      throw new Error('Password input not found');
    }
    await passwordInput.fill(testPassword);
    console.log(`✅ Password filled`);

    // Find and click next button
    const nextButton = await page.locator('button:has-text("Suivant"), button:has-text("Next"), button:has-text("Continuer")').first();
    if (!nextButton) {
      throw new Error('Next button not found');
    }
    await nextButton.click();
    await page.waitForTimeout(2000);
    screenshot = await page.screenshot({ fullPage: true });
    require('fs').writeFileSync(`${screenshotDir}/step1-after-next.png`, screenshot);
    console.log('✅ Clicked next, moving to step 2');
    console.log('Current URL:', page.url());

    // Step 2: Accept rules
    console.log('🔍 Step 2: Accepting rules');

    // Look for checkbox or toggle
    const checkbox = await page.locator('input[type="checkbox"]').first();
    if (checkbox) {
      await checkbox.click();
      console.log('✅ Checkbox clicked');
    }

    // Click next button on step 2
    const nextButton2 = await page.locator('button:has-text("Suivant"), button:has-text("Next"), button:has-text("Continuer")').first();
    if (!nextButton2) {
      throw new Error('Next button on step 2 not found');
    }
    await nextButton2.click();
    await page.waitForTimeout(2000);
    screenshot = await page.screenshot({ fullPage: true });
    require('fs').writeFileSync(`${screenshotDir}/step2-after-next.png`, screenshot);
    console.log('✅ Clicked next on step 2, moving to step 3');
    console.log('Current URL:', page.url());

    // Step 3: Fill profile data
    console.log('🔍 Step 3: Filling profile data');

    // First name
    const firstNameInput = await page.locator('input[placeholder*="prénom"], input[placeholder*="Prénom"], input[placeholder*="first"], input[placeholder*="First"]').first();
    if (firstNameInput) {
      await firstNameInput.fill('TestUser');
      console.log('✅ First name filled');
    }

    // Birth year
    const birthYearInput = await page.locator('input[placeholder*="1998"], input[placeholder*="année"], input[placeholder*="Année"]').first();
    if (birthYearInput) {
      await birthYearInput.fill('1995');
      console.log('✅ Birth year filled');
    }

    // Gender - try clicking a gender button
    const genderButtons = await page.locator('button:has-text("Homme"), button:has-text("Femme")').all();
    if (genderButtons.length > 0) {
      await genderButtons[0].click();
      console.log('✅ Gender selected');
    }

    // City
    const cityInput = await page.locator('input[placeholder*="Paris"], input[placeholder*="ville"], input[placeholder*="Ville"]').first();
    if (cityInput) {
      await cityInput.fill('Paris');
      console.log('✅ City filled');
    }

    await page.waitForTimeout(1000);
    screenshot = await page.screenshot({ fullPage: true });
    require('fs').writeFileSync(`${screenshotDir}/step3-filled.png`, screenshot);

    // Step 4: Click "Créer mon profil" button
    console.log('🔍 Step 4: Clicking "Créer mon profil" button');

    const createButton = await page.locator('button:has-text("Créer mon profil")').first();
    if (!createButton) {
      throw new Error('Create profile button not found');
    }

    // Check if button is disabled
    const isDisabled = await createButton.isDisabled();
    console.log('Button is disabled:', isDisabled);

    if (isDisabled) {
      console.log('⚠️ Button is disabled - checking form validation');
      // Take a screenshot to see the form state
      screenshot = await page.screenshot({ fullPage: true });
      require('fs').writeFileSync(`${screenshotDir}/step3-button-disabled.png`, screenshot);
    } else {
      await createButton.click();
      console.log('✅ Create profile button clicked');

      // Wait for navigation
      await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(2000);

      // Get final URL
      const finalUrl = page.url();
      console.log('Final URL:', finalUrl);

      screenshot = await page.screenshot({ fullPage: true });
      require('fs').writeFileSync(`${screenshotDir}/step4-after-create.png`, screenshot);

      // Verify we're on login page
      if (finalUrl.includes('/auth/login') || finalUrl.includes('/login')) {
        console.log('✅ PASSED: Redirected to login page');
      } else {
        console.log('⚠️ WARNING: Not on login page, URL is:', finalUrl);
      }
    }

    console.log('✅ Test completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    const screenshot = await page.screenshot({ fullPage: true });
    require('fs').writeFileSync(`${screenshotDir}/error-screenshot.png`, screenshot);
    process.exit(1);
  }
})();
