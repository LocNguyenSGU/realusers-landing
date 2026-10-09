# ThreadFlow landing page

Bản nháp landing page cho ThreadFlow, dịch vụ đăng bài và tương tác Threads cho thương hiệu. Mục đích: để cả nhóm xem và góp ý **trước khi** bắt tay làm bản thật.

**Xem trang:** https://locnguyensgu.github.io/threadflow-landing/

## Góp ý thế nào

Mở một [Issue](https://github.com/LocNguyenSGU/threadflow-landing/issues/new), ghi rõ:

- Phần nào của trang (hero, số liệu, một ngày vận hành, theo ngành, cách hoạt động, nền tảng, theo quy mô, an toàn, câu hỏi, footer).
- Thấy gì chưa ổn, và muốn sửa thành gì.
- Nếu là về giao diện, đính kèm ảnh chụp màn hình.

## Nguồn của nội dung

- Bố cục và giao diện dựng theo trang chủ RedTrack.
- Nội dung lấy từ `hub_docs`: tính năng, quyết định (D-01, D-05, D-13, D-16, D-17, D-22) và trang tổng hợp tính năng web ngày 04/10/2026.
- Mọi số liệu trong mục "Một ngày của lô bài" và thẻ báo cáo là **minh hoạ**, không phải dữ liệu thật.

## Cần chốt trước khi đưa ra ngoài

1. Mục "Những việc ThreadFlow không làm" dựa trên D-22, nhưng code `thread-secret` vẫn còn quyền kịch bản thảo luận (`Plan.hoi_thoai_kich_ban_bat`). Giữ hay sửa mục này?
2. Câu trả lời về thanh toán VietQR viết theo plan SePay, chưa chạy giao dịch thật, D-31 chưa chốt.
3. Nhãn công bố cho nội dung tài trợ (D-O6) chưa có chữ chốt nên trang chưa nhắc tới.
4. Trang chưa có giá. Giá gói do admin cấu hình, chưa có bảng giá công khai.

## Chạy tại máy

Một file HTML tĩnh, không cần build. Mở `index.html` bằng trình duyệt.
