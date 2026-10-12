# RealUsers landing page

Landing page cho RealUsers, dịch vụ đăng bài và tương tác Threads cho thương hiệu (trước đây là bản nháp ThreadFlow).

**Xem trang:** https://locnguyensgu.github.io/threadflow-landing/

## Nội dung

Chữ trên trang lấy từ [CONTENT.md](CONTENT.md): bảng audit bản cũ và toàn bộ nội dung mới. Đây là bản nháp, chữ chốt sẽ được wording lại sau.

Mọi số liệu trong thẻ báo cáo là **minh hoạ**, không phải dữ liệu thật.

## Thiết kế

- Màu: trắng, đen và xanh dương Meta (`#0866FF`). Token nằm ở đầu `<style>` trong `index.html` và trong [.superdesign/design-system.md](.superdesign/design-system.md).
- Font: Be Vietnam Pro.
- Mẫu gốc là hướng A trên Superdesign. Hai hướng B và C vẫn còn trên canvas để so sánh.

## Hiệu ứng và tương tác

- Hero: tiêu đề hiện từng chữ, bài Threads trong điện thoại nhận bình luận lần lượt và số like tăng, điện thoại nghiêng theo chuột. Thẻ "Chờ bạn duyệt" có nút Duyệt và Xem bấm được.
- Cuộn trang: các khối trượt lên, thanh tiến độ ở mép trên, menu tự đánh dấu mục đang xem.
- Cách hoạt động: đường nối chạy qua 4 bước, mỗi bước ghi ai làm.
- Theo quy mô: tab trượt, thẻ báo cáo đổi số theo tab, thanh số liệu chạy và số đếm tăng dần.
- Thẻ tính năng có vệt sáng theo chuột, FAQ mở đóng mượt, menu mobile.
- Máy bật "giảm chuyển động" thì trang tắt hết hiệu ứng và hiện nội dung tĩnh.

## Cần chốt trước khi đưa ra ngoài

1. Mục "Những việc ... không làm" đã tạm bỏ, vì code `thread-secret` vẫn còn quyền kịch bản thảo luận (`Plan.hoi_thoai_kich_ban_bat`). Giữ hay bỏ hẳn?
2. Thanh toán VietQR viết theo plan SePay, chưa chạy giao dịch thật, D-31 chưa chốt.
3. Chưa có logo RealUsers. Trang đang dùng chữ kèm một ô vuông xanh.
4. Trang chưa có giá. Giá gói do admin cấu hình, chưa có bảng giá công khai.
5. Các nút "Bắt đầu ngay", "Đăng nhập" đang trỏ về mục cuối trang, chưa nối vào app thật.

## Chạy tại máy

Một file HTML tĩnh, không cần build. Mở `index.html` bằng trình duyệt.
