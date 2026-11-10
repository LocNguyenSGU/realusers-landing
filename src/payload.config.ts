import { postgresAdapter } from '@payloadcms/db-postgres'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { en } from '@payloadcms/translations/languages/en'
import { vi } from '@payloadcms/translations/languages/vi'
import path from 'path'
import { buildConfig, type PayloadRequest } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { isAdminOrEditor } from './access'
import { Authors } from './collections/Authors'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { BlogSettings } from './globals/BlogSettings'
import { revalidateBlog } from './hooks/revalidate'
import { absoluteUrl, paths, SITE_NAME, SITE_URL } from './lib/site'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Ảnh production nằm trên Cloudflare R2 (cùng tài khoản R2 của thread-secret, bucket/prefix riêng).
// Thiếu biến R2_* thì lưu ở ổ đĩa (./media), chỉ dùng cho máy local: Vercel không giữ file ghi ra đĩa.
const r2Enabled = Boolean(process.env.R2_BUCKET && process.env.R2_ACCOUNT_ID)
const r2PublicBase = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/$/, '')

export default buildConfig({
  serverURL: SITE_URL,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · Quản trị blog RealUsers' },
    dateFormat: 'dd/MM/yyyy HH:mm',
  },
  i18n: { supportedLanguages: { vi, en }, fallbackLanguage: 'vi' },
  collections: [Posts, Categories, Authors, Media, Users],
  globals: [BlogSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Mặc định KHÔNG tự đẩy schema: mọi thay đổi bảng đi qua migration (npm run db:migrate:create / db:migrate).
    // Test tích hợp bật PAYLOAD_DB_PUSH=true trên DB test riêng.
    push: process.env.PAYLOAD_DB_PUSH === 'true',
  }),
  sharp,
  graphQL: { disable: false },
  jobs: {
    // Hẹn giờ đăng bài: Vercel Cron gọi /api/payload-jobs/run kèm "Authorization: Bearer $CRON_SECRET".
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        if (req.user) return true
        const secret = process.env.CRON_SECRET
        return Boolean(secret) && req.headers.get('authorization') === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
  plugins: [
    seoPlugin({
      generateTitle: ({ doc }) => (doc?.title ? `${doc.title} | ${SITE_NAME}` : SITE_NAME),
      generateDescription: ({ doc }) => (typeof doc?.excerpt === 'string' ? doc.excerpt.slice(0, 160) : ''),
      generateURL: ({ doc }) => (doc?.slug ? absoluteUrl(paths.post(doc.slug)) : SITE_URL),
    }),
    redirectsPlugin({
      collections: ['posts'],
      redirectTypes: ['301', '302'],
      overrides: {
        labels: { singular: 'Chuyển hướng', plural: 'Chuyển hướng (301)' },
        admin: { group: 'Hệ thống' },
        access: { read: () => true, create: isAdminOrEditor, update: isAdminOrEditor, delete: isAdminOrEditor },
        hooks: { afterChange: [({ doc, req }) => (revalidateBlog(req), doc)] },
      },
    }),
    s3Storage({
      enabled: r2Enabled,
      bucket: process.env.R2_BUCKET || '',
      collections: {
        media: {
          prefix: 'blog',
          // File công khai trên R2: trả thẳng link R2, không đi vòng qua server Next.
          ...(r2PublicBase
            ? {
                disablePayloadAccessControl: true as const,
                generateFileURL: ({ filename, prefix }) => `${r2PublicBase}/${prefix ? `${prefix}/` : ''}${filename}`,
              }
            : {}),
        },
      },
      config: {
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
