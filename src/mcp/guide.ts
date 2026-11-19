// Hướng dẫn viết bài cho AI dùng qua MCP. Đặt ở server để mọi máy, mọi phiên AI viết theo cùng một luật.
// Sửa luật viết thì sửa file này rồi deploy.

export const WRITING_GUIDE = `# Luật viết bài blog RealUsers

## RealUsers là gì (để viết đúng)
- Nền tảng Conversation Marketing trên Threads: thương hiệu chủ động mở những cuộc trò chuyện có ích và tham gia đúng thảo luận khách đang nói, thay vì đăng quảng cáo rồi chờ.
- Người đọc: chủ shop, thương hiệu nhỏ, người làm marketing ở Việt Nam.
- Khối kêu gọi cuối bài đã có sẵn trên site. Đừng tự viết đoạn kêu gọi đăng ký ở cuối bài.

## Giọng văn
- Viết như một người làm nghề đang nói chuyện với chủ shop: tự nhiên, cụ thể, có ví dụ đời thường.
- Không văn dịch, không câu cụt kiểu khẩu hiệu. Đoạn ngắn 2–4 câu.
- Không bao giờ nói bài do AI viết, không nhắc "AI soạn", "AI gợi ý" khi nói về nội dung của RealUsers.
- Không bịa số liệu, nghiên cứu, khách hàng. Số nào cũng phải có nguồn thật (ghi tên nguồn trong câu), không có thì viết định tính.

## Cấu trúc
- title: tiêu đề bài (là H1 của trang), 50–65 ký tự, chứa từ khoá chính.
- excerpt (sapo): 1–2 câu, 120–160 ký tự. Dùng làm mô tả trên Google khi không có metaDescription.
- markdown: thân bài. KHÔNG có H1. Mục lớn dùng "##", mục con "###". Mục lục tự dựng từ H2/H3.
- Mở bài 2–3 câu vào thẳng vấn đề người đọc đang gặp. Mỗi H2 trả lời một câu hỏi cụ thể.
- Danh sách, bảng markdown, **in đậm** dùng được. Link trong bài dùng đường dẫn tương đối có "/" cuối, ví dụ [tên bài](/blog/cach-tang-tuong-tac-tren-threads/).
- Gắn 1–3 link sang bài liên quan đã có (xem blogOverview).
- Khối đặc biệt (mỗi loại tối đa 1–2 lần một bài):
  <Callout tone="tip" title="Mẹo nhỏ">Nội dung ô ghi chú</Callout>   (tone: tip | warning | example)
  <Cta title="Thử RealUsers miễn phí" buttonLabel="Tạo tài khoản miễn phí" url="https://app.realusers.net/dang-ky">Một câu mời</Cta>
- faq: 3–5 câu hỏi người đọc hay hỏi thật, trả lời 1–3 câu. Hiện cuối bài và khai báo FAQ cho Google.
- slug: chữ thường không dấu, gạch ngang, ngắn, chứa từ khoá (vd "cach-seeding-threads"). Bỏ trống thì tự sinh từ tiêu đề.
- metaTitle (tuỳ chọn, ≤ 60 ký tự): tiêu đề hiện trên Google nếu muốn khác title. Site tự thêm " | RealUsers".
- Ảnh đầu bài: tuỳ chọn. Có link ảnh thì uploadImage (alt mô tả ảnh) rồi truyền coverImageId. Không có thì site tự vẽ ảnh theo tiêu đề.

## Bản tiếng Anh
- Bài tạo bằng tiếng Việt trước. Dịch bằng updatePost với locale "en": title, excerpt, markdown, faq và slug tiếng Anh.
- Dịch lại cho người đọc tiếng Anh, không dịch từng chữ. Link nội bộ trỏ sang /en/blog/<slug-en>/ nếu bài đó có bản tiếng Anh.

## Quy trình
1. blogOverview: xem bài đã có (tránh trùng chủ đề, chọn bài để link), chọn category và author.
2. createPost với action "draft". Đọc lại bằng getPost nếu cần sửa (updatePost).
3. Đăng: action "publish" (đăng ngay) hoặc "schedule" kèm publishAt, ví dụ "2026-11-23T08:00:00+07:00".
   Lịch được kiểm khoảng 15 phút một lần, nên bài lên trong vòng ~15 phút sau giờ hẹn.
4. Đổi giờ: schedulePost lại (giờ cũ tự huỷ). Huỷ hẹn: cancelSchedule.
`

export const SERVER_INSTRUCTIONS = `Đây là blog www.realusers.net (RealUsers, làm thương hiệu bằng cách trò chuyện trên Threads).
Bắt đầu bằng blogOverview để biết chuyên mục, tác giả, bài đã có và lịch đăng.
Nội dung bài gửi bằng markdown. Giờ hẹn đăng theo giờ Việt Nam, ghi kèm +07:00.

${WRITING_GUIDE}`

export const writeBlogPostPrompt = (args: { topic?: string; keyword?: string; notes?: string }): string =>
  [
    WRITING_GUIDE,
    '---',
    'Việc cần làm: viết một bài blog mới theo luật trên.',
    args.topic ? `Chủ đề: ${args.topic}` : '',
    args.keyword ? `Từ khoá chính: ${args.keyword}` : '',
    args.notes ? `Ghi chú thêm: ${args.notes}` : '',
    'Gọi blogOverview trước, rồi createPost (action "draft" trừ khi được dặn đăng/hẹn giờ).',
  ]
    .filter(Boolean)
    .join('\n')
