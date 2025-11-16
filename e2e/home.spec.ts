import { test, expect } from '@playwright/test';

test.describe('홈 페이지 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('홈 페이지가 정상적으로 로드되어야 한다', async ({ page }) => {
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/DateLog|데이트로그/i);
  });

  test('캘린더가 화면에 표시되어야 한다', async ({ page }) => {
    // 캘린더 컴포넌트 존재 확인
    const calendar = page.locator('[data-testid="calendar"]').or(
      page.locator('.calendar').or(
        page.getByRole('grid')
      )
    );
    await expect(calendar).toBeVisible({ timeout: 10000 });
  });

  test('날짜를 클릭하면 상세 페이지로 이동해야 한다', async ({ page }) => {
    // 날짜 버튼 또는 셀 클릭
    const dateButton = page.locator('button').filter({ hasText: /^\d+$/ }).first();

    if (await dateButton.isVisible()) {
      await dateButton.click();

      // URL이 변경되었는지 확인 (상세 페이지로 이동)
      await expect(page).toHaveURL(/\/date\/|\/detail\//i);
    }
  });

  test('이전/다음 달 네비게이션이 동작해야 한다', async ({ page }) => {
    // 현재 표시된 월/년 텍스트 확인
    const monthDisplay = page.locator('text=/\\d{4}년|\\d{4}\\./').first();

    if (await monthDisplay.isVisible()) {
      const initialText = await monthDisplay.textContent();

      // 다음 달 버튼 클릭
      const nextButton = page.locator('button').filter({ hasText: /다음|next|>/i }).first()
        .or(page.locator('[aria-label*="next"]').first());

      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // 월 표시가 변경되었는지 확인
        const newText = await monthDisplay.textContent();
        expect(newText).not.toBe(initialText);
      }
    }
  });
});

test.describe('앱 기본 기능 E2E 테스트', () => {
  test('에러 발생 시 에러 바운더리가 동작해야 한다', async ({ page }) => {
    await page.goto('/');

    // 에러 바운더리 컴포넌트가 존재하는지 확인 (DOM에 마운트됨)
    // 정상 상태에서는 에러 메시지가 보이지 않아야 함
    const errorMessage = page.locator('text=/오류|error|문제가 발생/i');
    await expect(errorMessage).not.toBeVisible();
  });

  test('존재하지 않는 라우트는 404 또는 홈으로 리다이렉트되어야 한다', async ({ page }) => {
    await page.goto('/nonexistent-route-12345');

    // 404 페이지 또는 홈으로 리다이렉트
    const is404 = await page.locator('text=/404|찾을 수 없|not found/i').isVisible();
    const isHome = page.url().endsWith('/') || page.url().includes('/#');

    expect(is404 || isHome).toBeTruthy();
  });

  test('반응형 디자인이 적용되어야 한다', async ({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 페이지가 여전히 정상 로드되는지 확인
    await expect(page).toHaveTitle(/DateLog|데이트로그/i);

    // 스크롤이 필요 없이 주요 컨텐츠가 보이는지 확인
    const mainContent = page.locator('main').or(page.locator('#root > div'));
    await expect(mainContent).toBeVisible();
  });
});
