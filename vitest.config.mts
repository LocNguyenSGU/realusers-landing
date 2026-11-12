import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    projects: [
      {
        plugins: [tsconfigPaths()],
        test: { name: 'unit', environment: 'node', include: ['tests/unit/**/*.test.ts'] },
      },
      {
        plugins: [tsconfigPaths()],
        test: {
          name: 'int',
          environment: 'node',
          include: ['tests/int/**/*.test.ts'],
          setupFiles: ['./vitest.setup.ts'],
          // Một DB test riêng, Payload tự đẩy schema (không đụng DB dev/production).
          env: {
            DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgres://postgres@127.0.0.1:5433/realusers_blog_test',
            PAYLOAD_DB_PUSH: 'true',
            MEDIA_DIR: 'media-test',
          },
          testTimeout: 60_000,
          hookTimeout: 120_000,
          fileParallelism: false,
        },
      },
    ],
  },
})
