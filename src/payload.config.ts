import { postgresAdapter } from '@payloadcms/db-postgres'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
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

// Ảnh production: có R2_* thì lưu Cloudflare R2; không có mà có BLOB_READ_WRITE_TOKEN (Vercel tự gắn khi
// nối Blob store vào project) thì lưu Vercel Blob. Không có cả hai thì lưu ổ đĩa (./media), chỉ dùng
// cho máy local hoặc VPS: Vercel không giữ file ghi ra đĩa.
// Cả hai plugin bật alwaysInsertFields để cột media.prefix luôn có trong schema, dù chọn nơi lưu nào
// (schema đi qua migration, không được đổi theo biến môi trường).
const r2Enabled = Boolean(process.env.R2_BUCKET && process.env.R2_ACCOUNT_ID)
const blobEnabled = !r2Enabled && Boolean(process.env.BLOB_READ_WRITE_TOKEN)
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
  // Nội dung đa ngôn ngữ, tiếng Việt là ngôn ngữ chính.
  // fallback: true để lời gọi API không ghi ?locale= vẫn hiểu là tiếng Việt (để false thì Payload 3.92 không gán
  // ngôn ngữ cho request và ghi hỏng dữ liệu, lỗi đã gặp 11/11). Trang công khai vẫn KHÔNG đắp chữ tiếng Việt vào
  // trang tiếng Anh: src/lib/data.ts luôn truy vấn với fallbackLocale: false.
  localization: {
    locales: [
      { code: 'vi', label: 'Tiếng Việt' },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'vi',
    fallback: true,
  },
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
      alwaysInsertFields: true,
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
    vercelBlobStorage({
      enabled: blobEnabled,
      alwaysInsertFields: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      // Link ảnh trỏ thẳng về Blob (https://<store>.public.blob.vercel-storage.com/blog/...), không đi vòng qua server.
      collections: { media: { prefix: 'blog', disablePayloadAccessControl: true } },
    }),
  ],
})
