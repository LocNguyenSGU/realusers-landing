import { defineConfig, devices } from '@playwright/test'

// Chạy trên bản build production: `npm run build` rồi `npm run test:e2e`.
// Server tự bật ở cổng E2E_PORT (mặc định 3100), dùng DB trong .env (đã migrate + seed:old-posts).
const port = Number(process.env.E2E_PORT || 3100)
// PW_CHANNEL=chrome: dùng Chrome có sẵn trên máy thay vì tải trình duyệt của Playwright.
const channel = process.env.PW_CHANNEL || undefined

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  // Một luồng: các spec đăng bài / dịch bài cùng ghi vào một DB, chạy song song sẽ giẫm nhau.
  workers: 1,
  use: { baseURL: `http://localhost:${port}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, channel } },
  ],
  webServer: {
    command: `npx next start -p ${port}`,
    url: `http://localhost:${port}/robots.txt`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
