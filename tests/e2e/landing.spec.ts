import { test, expect } from '@playwright/test';

test('landing page visual layout and interactive elements', async ({ page }) => {
  await page.goto('/');
  
  // Verify core branding
  await expect(page.locator('text=SENDA')).toBeVisible();
  await expect(page.locator('text=QUEST')).toBeVisible();
  
  // Verify the unauthenticated state button is present
  const signInButton = page.locator('button:has-text("Sign In to Play")');
  await expect(signInButton).toBeVisible();
  
  // Verify the thematic quote
  await expect(page.locator('text=The dice are cast in the shadows')).toBeVisible();
});
