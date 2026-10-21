import { test, expect } from '@playwright/test';
test('React reads a real Spring Boot and H2 result', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Environment ready');
  await page.reload();
  await expect(page.getByRole('status')).toHaveText('Environment ready');
});
