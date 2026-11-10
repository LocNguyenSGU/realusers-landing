import type { Access, FieldAccess, PayloadRequest } from 'payload'

export type Role = 'admin' | 'editor' | 'writer'

type WithRole = { role?: Role | null }

export const roleOf = (req: PayloadRequest): Role | null => (req.user as WithRole | null)?.role ?? null

export const anyone: Access = () => true
export const loggedIn: Access = ({ req }) => Boolean(req.user)
export const isAdmin: Access = ({ req }) => roleOf(req) === 'admin'
export const isAdminOrEditor: Access = ({ req }) => ['admin', 'editor'].includes(roleOf(req) ?? '')
export const isAdminField: FieldAccess = ({ req }) => roleOf(req) === 'admin'

/** Khách chỉ thấy bài đã đăng. Người đăng nhập trang quản trị thấy cả bản nháp. */
export const publishedOrLoggedIn: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}

/** Admin sửa được mọi tài khoản; người khác chỉ sửa tài khoản của mình. */
export const adminOrSelf: Access = ({ req }) => {
  if (roleOf(req) === 'admin') return true
  if (!req.user) return false
  return { id: { equals: req.user.id } }
}
