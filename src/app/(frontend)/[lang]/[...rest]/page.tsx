import { notFound } from 'next/navigation'

// Đường dẫn lạ trong một ngôn ngữ: trả trang 404 có giao diện site (thay vì trang 404 trắng của Next).
export default function CatchAll() {
  notFound()
}
