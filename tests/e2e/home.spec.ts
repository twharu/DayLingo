import { test, expect } from '@playwright/test';

test('home renders title and link', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '日本留學生活日語學習' })).toBeVisible();
  const vocabLink = page.getByRole('link', { name: '📚 單字庫' });
  await expect(vocabLink).toBeVisible();
  await expect(vocabLink).toHaveAttribute('href', '/vocabulary');
});



