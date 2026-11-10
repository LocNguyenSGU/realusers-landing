import type { CollectionConfig } from 'payload'

import { adminOrSelf, isAdmin, isAdminField, loggedIn } from '@/access'

/**
 * Tài khoản trang quản trị blog. Không dùng chung với app.realusers.net.
 * - admin: toàn quyền, quản lý tài khoản.
 * - editor: viết, đăng, xoá bài; quản lý chuyên mục, tác giả.
 * - writer: chỉ viết và lưu nháp, không đăng được.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Tài khoản', plural: 'Tài khoản' },
  auth: true,
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'email', 'role'], group: 'Hệ thống' },
  access: {
    admin: ({ req }) => Boolean(req.user),
    read: loggedIn,
    create: isAdmin,
    update: adminOrSelf,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', label: 'Tên', type: 'text', required: true },
    {
      name: 'role',
      label: 'Vai trò',
      type: 'select',
      required: true,
      defaultValue: 'writer',
      saveToJWT: true,
      access: { create: isAdminField, update: isAdminField },
      options: [
        { label: 'Quản trị (admin)', value: 'admin' },
        { label: 'Biên tập, được đăng bài (editor)', value: 'editor' },
        { label: 'Người viết, chỉ lưu nháp (writer)', value: 'writer' },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      // Tài khoản đầu tiên (tạo ở /admin/create-first-user) luôn là admin.
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true, req })
        if (totalDocs === 0) return { ...data, role: 'admin' }
        return data
      },
    ],
  },
}
