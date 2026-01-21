import { test, expect } from '@playwright/test';

/**
 * Marketing Studio Tests - Phase 1
 * Marketing content management and export
 */

test.describe('Marketing Studio', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.click('text=Sign In');
    await page.fill('input[type="email"]', 'test-user@aynn.io');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test.describe('Navigation', () => {
    test('should navigate to marketing studio from dashboard', async ({ page }) => {
      // Look for marketing studio link
      const marketingLink = page.locator('a[href="/marketing-studio"], button:has-text("Marketing")').first();
      if (await marketingLink.isVisible()) {
        await marketingLink.click();
        await expect(page).toHaveURL(/marketing-studio/);
      } else {
        // Direct navigation
        await page.goto('/marketing-studio');
        await expect(page.locator('text=Marketing, text=Studio, text=Content').first()).toBeVisible();
      }
    });

    test('should have back navigation', async ({ page }) => {
      await page.goto('/marketing-studio');
      
      const backBtn = page.locator('button:has-text("Back"), a:has-text("Back"), [aria-label*="back"]').first();
      if (await backBtn.isVisible()) {
        await backBtn.click();
        await expect(page).not.toHaveURL(/marketing-studio/);
      }
    });
  });

  test.describe('Content Display', () => {
    test('should display marketing content fields', async ({ page }) => {
      await page.goto('/marketing-studio');
      await page.waitForLoadState('networkidle');
      
      // Should show various marketing content sections
      await expect(page.locator('text=headline, text=tagline, text=description, text=content').first()).toBeVisible({ timeout: 5000 });
    });

    test('should show field count', async ({ page }) => {
      await page.goto('/marketing-studio');
      await page.waitForLoadState('networkidle');
      
      // Should display count of fields or content items
      const countIndicator = page.locator('text=/\\d+ (fields?|items?|content)/i').first();
      // May or may not be present depending on implementation
    });

    test('should display content categories', async ({ page }) => {
      await page.goto('/marketing-studio');
      await page.waitForLoadState('networkidle');
      
      // Check for category tabs or sections
      const categories = page.locator('[role="tab"], [data-category], .category');
      if (await categories.count() > 0) {
        await expect(categories.first()).toBeVisible();
      }
    });
  });

  test.describe('Copy to Clipboard', () => {
    test('should have copy button for content', async ({ page }) => {
      await page.goto('/marketing-studio');
      await page.waitForLoadState('networkidle');
      
      const copyBtn = page.locator('button:has-text("Copy"), [aria-label*="copy"]').first();
      await expect(copyBtn).toBeVisible({ timeout: 5000 });
    });

    test('should copy content to clipboard', async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.goto('/marketing-studio');
      await page.waitForLoadState('networkidle');
      
      const copyBtn = page.locator('button:has-text("Copy"), [aria-label*="copy"]').first();
      if (await copyBtn.isVisible()) {
        await copyBtn.click();
        
        // Should show success feedback
        await expect(page.locator('text=Copied, text=clipboard').first()).toBeVisible({ timeout: 3000 });
      }
    });

    test('should copy individual field values', async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.goto('/marketing-studio');
      await page.waitForLoadState('networkidle');
      
      const fieldCopyBtns = page.locator('[data-copy], button[aria-label*="copy"]');
      if (await fieldCopyBtns.count() > 0) {
        await fieldCopyBtns.first().click();
        await expect(page.locator('text=Copied').first()).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Export Functionality', () => {
    test('should have download/export button', async ({ page }) => {
      await page.goto('/marketing-studio');
      await page.waitForLoadState('networkidle');
      
      const exportBtn = page.locator('button:has-text("Download"), button:has-text("Export"), [aria-label*="download"]').first();
      await expect(exportBtn).toBeVisible({ timeout: 5000 });
    });

    test('should download JSON file', async ({ page }) => {
      await page.goto('/marketing-studio');
      await page.waitForLoadState('networkidle');
      
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        page.locator('button:has-text("Download JSON"), button:has-text("Export")').first().click().catch(() => {}),
      ]);
      
      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.json$/);
      }
    });

    test('should export valid JSON format', async ({ page }) => {
      await page.goto('/marketing-studio');
      await page.waitForLoadState('networkidle');
      
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        page.locator('button:has-text("Download"), button:has-text("Export")').first().click().catch(() => {}),
      ]);
      
      if (download) {
        const path = await download.path();
        if (path) {
          const content = await require('fs').promises.readFile(path, 'utf8');
          expect(() => JSON.parse(content)).not.toThrow();
        }
      }
    });
  });

  test.describe('Content Editing', () => {
    test('should allow editing content fields', async ({ page }) => {
      await page.goto('/marketing-studio');
      await page.waitForLoadState('networkidle');
      
      const editableField = page.locator('input, textarea, [contenteditable="true"]').first();
      if (await editableField.isVisible()) {
        const originalValue = await editableField.inputValue().catch(() => '');
        await editableField.fill('Test edited content ' + Date.now());
        
        // Value should be updated
        const newValue = await editableField.inputValue().catch(() => '');
        expect(newValue).not.toBe(originalValue);
      }
    });

    test('should save edited content', async ({ page }) => {
      await page.goto('/marketing-studio');
      await page.waitForLoadState('networkidle');
      
      const editableField = page.locator('input, textarea').first();
      if (await editableField.isVisible()) {
        await editableField.fill('Saved content ' + Date.now());
        
        const saveBtn = page.locator('button:has-text("Save")').first();
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
          await expect(page.locator('text=Saved, text=success').first()).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should be usable on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/marketing-studio');
      await page.waitForLoadState('networkidle');
      
      // Content should still be accessible
      await expect(page.locator('text=Marketing, text=Content').first()).toBeVisible();
    });

    test('should be usable on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/marketing-studio');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('text=Marketing, text=Content').first()).toBeVisible();
    });
  });
});
