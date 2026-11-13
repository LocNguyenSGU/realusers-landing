// Nội dung từng ảnh minh hoạ (vi + en). Tên, tài khoản, số liệu là ví dụ minh hoạ, lấy từ ví dụ trong bài.
const A = {
  may: { handle: 'tiembanhmay', initials: 'M', color: '#e8833a', brand: true },
  shopMay: { handle: 'shopmay.beauty', initials: 'S', color: '#c2577a', brand: true },
  sach: { handle: 'tiemsachcu.q3', initials: 'S', color: '#5b7a4a', brand: true },
  u1: { handle: 'linh.ng', initials: 'L', color: '#7a6ff0' },
  u2: { handle: 'tuan_q3', initials: 'T', color: '#2f9e8f' },
  u3: { handle: 'ha.my.92', initials: 'H', color: '#d4a017' },
  u4: { handle: 'minhkhoa', initials: 'K', color: '#4a79c9' },
  u5: { handle: 'thao.dang', initials: 'T', color: '#b5654a' },
}

// Bản tiếng Anh đổi handle sang dạng tiếng Anh cho tự nhiên.
const E = {
  may: { ...A.may, handle: 'maybakery' },
  shopMay: { ...A.shopMay, handle: 'may.beauty' },
  sach: { ...A.sach, handle: 'oldbooks.d3' },
  u1: { ...A.u1, handle: 'linh.ng' },
  u2: { ...A.u2, handle: 'tuan_d3' },
  u3: { ...A.u3, handle: 'hamy.92' },
  u4: { ...A.u4, handle: 'minhkhoa' },
  u5: { ...A.u5, handle: 'thao.dang' },
}

const scenes = []

// Bài 1: Threads là gì — hồ sơ rõ ràng, bài hỏi thật có người trả lời, bảng tin đưa bài tới người lạ.
for (const [lang, a, t] of [
  ['vi', A, {
    p1: 'Hồ sơ rõ ràng', p2: 'Một câu hỏi thật', p3: 'Người lạ cũng thấy bài',
    name: 'Tiệm Bánh Mì Mây', bio: 'Bánh mì nướng củi ở Quận 3 🥖\nMở 6h–11h sáng, giao Quận 1, 3', link: 'realusers.net/tiembanhmay', fol: '1.284 người theo dõi',
    follow: 'Theo dõi', mention: 'Nhắc đến', tabs: ['Bài viết', 'Trả lời', 'Đăng lại'],
    bioPost: 'Sáng nay mẻ đầu ra lò lúc 5h45, hết sạch lúc 7h. Mai tụi mình làm thêm 40 ổ nha 🙏',
    q: 'Hỏi thật, mọi người ăn bánh mì buổi sáng thì thích pate nhiều hay ít? Tiệm mình đang cãi nhau vụ này 😅',
    r1: 'Nhiều! Pate là linh hồn của ổ bánh mì', r2: 'Ít thôi, nhiều là ngấy liền á', r3: 'Tuỳ hôm, hôm nào đói thì xin thêm 🤣',
    feed: 'Dành cho bạn',
    s1: 'Có ai biết tiệm bánh mì nào ở Quận 3 vỏ giòn thật sự không? Mình chán bánh mì mềm rồi',
    s2: 'Tiệm mình ở Quận 3 nè, bánh nướng củi nên vỏ giòn lâu. Nếu bạn ở gần Hồ Con Rùa thì ghé thử, không thì hỏi thêm mọi người dưới này nha!',
    s3: 'Ủa tiệm này mình đi ngang hoài mà chưa ghé, mai thử',
    c1t: 'Câu hỏi thật', c1: 'Không bán gì, nhưng ai đọc cũng có ý kiến.',
    c2t: 'Bảng tin "Dành cho bạn"', c2: 'Bài của tài khoản bạn chưa theo dõi vẫn hiện ra.',
  }],
  ['en', E, {
    p1: 'A clear profile', p2: 'A real question', p3: 'Strangers see it too',
    name: 'May Bakery', bio: 'Wood-fired bánh mì in District 3 🥖\nOpen 6–11am, delivery to D1 & D3', link: 'realusers.net/maybakery', fol: '1,284 followers',
    follow: 'Follow', mention: 'Mention', tabs: ['Threads', 'Replies', 'Reposts'],
    bioPost: 'First batch came out at 5:45 this morning and sold out by 7. Baking 40 more tomorrow 🙏',
    q: 'Honest question: for breakfast bánh mì, do you want a lot of pâté or just a little? We can’t agree on this in the shop 😅',
    r1: 'A lot! Pâté is the soul of the sandwich', r2: 'Just a little, too much gets heavy fast', r3: 'Depends on how hungry I am 🤣',
    feed: 'For you',
    s1: 'Anyone know a bánh mì place in District 3 with a properly crunchy crust? I’m tired of soft bread',
    s2: 'We’re in District 3! Our bread is wood-fired so the crust stays crunchy. If you’re near Turtle Lake, drop by. If not, others here have good picks too!',
    s3: 'I walk past this place every day and never went in. Trying it tomorrow',
    c1t: 'A real question', c1: 'It sells nothing, but everyone has an opinion.',
    c2t: 'The "For you" feed', c2: 'Posts from accounts you don’t follow show up too.',
  }],
]) {
  scenes.push({
    file: `threads-la-gi-${lang}.png`,
    phones: [
      {
        title: '', back: true, label: t.p1,
        profile: { name: t.name, handle: a.may.handle, author: a.may, bio: t.bio, link: t.link, followers: t.fol, follow: t.follow, mention: t.mention, tabs: t.tabs },
        posts: [{ author: a.may, time: '2h', text: t.bioPost, counts: { heart: 86, reply: 14, repost: 3 } }],
      },
      {
        title: '', label: t.p2, tilt: 'up',
        posts: [
          { author: a.may, time: '1h', text: t.q, counts: { heart: 132, reply: 47, repost: 6 }, thread: true, mark: true },
          { author: a.u1, time: '52m', text: t.r1, counts: { heart: 21, reply: 3 }, reply: true },
          { author: a.u2, time: '40m', text: t.r2, counts: { heart: 15, reply: 2 }, reply: true },
        ],
        callout: { title: t.c1t, text: t.c1 },
      },
      {
        title: t.feed, label: t.p3,
        posts: [
          { author: a.u4, time: '3h', text: t.s1, counts: { heart: 58, reply: 23, repost: 2 }, thread: true },
          { author: a.may, time: '2h', text: t.s2, counts: { heart: 34, reply: 5 }, reply: true, mark: true },
        ],
        callout: { title: t.c2t, text: t.c2 },
      },
    ],
  })
}

// Bài 2: Tăng tương tác — câu mở đầu trước/sau, và trả lời đúng thảo luận người khác đang hỏi.
for (const [lang, a, t] of [
  ['vi', A, {
    bad: 'Trước: mở bằng quảng cáo', good: 'Sau: mở bằng câu hỏi',
    b1: 'Shop Mây ra mắt dòng son mới, màu đẹp, giá tốt! Inbox ngay để được tư vấn 💄💄 #son #sonmoi #sale #makeup',
    g1: 'Son màu đất có thật sự hợp da ngăm không, hay chỉ đẹp trên ảnh? Mình thử 3 màu tuần này, kết quả hơi bất ngờ 👀',
    gr1: 'Da mình ngăm, màu đất là chân ái luôn', gr2: 'Bất ngờ sao kể đi chị ơi 😆',
    c1t: 'Chừa chỗ cho người đọc nói', c1: 'Câu hỏi mở thì người ta mới trả lời.',
  }],
  ['en', E, {
    bad: 'Before: opens with an ad', good: 'After: opens with a question',
    b1: 'May Beauty just launched a new lipstick line, gorgeous shades, great prices! DM us now 💄💄 #lipstick #newin #sale #makeup',
    g1: 'Do earthy lipstick shades actually work on tan skin, or do they only look good in photos? I tried 3 this week and the result surprised me 👀',
    gr1: 'Tan skin here, earthy shades are my holy grail', gr2: 'Surprised how? Tell us 😆',
    c1t: 'Leave room for the reader', c1: 'An open question is what gets replies.',
  }],
]) {
  scenes.push({
    file: `tang-tuong-tac-${lang}.png`,
    phones: [
      {
        title: '', label: t.bad, labelTone: 'bad', tilt: 'down',
        posts: [{ author: a.shopMay, time: '3h', text: t.b1, counts: { heart: 4 } }],
      },
      {
        title: '', label: t.good, labelTone: 'good', tilt: 'up',
        posts: [
          { author: a.shopMay, time: '3h', text: t.g1, counts: { heart: 214, reply: 63, repost: 11 }, thread: true, mark: true },
          { author: a.u1, time: '2h', text: t.gr1, counts: { heart: 32, reply: 4 }, reply: true },
          { author: a.u3, time: '2h', text: t.gr2, counts: { heart: 18, reply: 1 }, reply: true },
        ],
        callout: { title: t.c1t, text: t.c1 },
      },
    ],
  })
}

// Bài 3: Viết bài để người lạ trả lời — trước/sau của tiệm bánh, và công thức ba dòng của tiệm sách cũ.
for (const [lang, a, t] of [
  ['vi', A, {
    bad: 'Trước: nói xong hết', good: 'Sau: mở ra cuộc trò chuyện', three: 'Công thức ba dòng',
    b1: 'Bánh mì nướng củi của tiệm Mây, vỏ giòn, ruột mềm, giao trong 30 phút. Đặt ngay!',
    g1: 'Bánh mì để qua đêm bị dai, mọi người cứu nó bằng cách nào? Tiệm mình hay nướng lại 3 phút bằng nồi chiên, nhưng chắc còn cách hay hơn.',
    gr1: 'Xịt chút nước rồi nướng lò 5 phút, giòn như mới', gr2: 'Mình làm bánh mì bơ tỏi luôn, khỏi phí 😋',
    s1: 'Sáng nay có bạn sinh viên mang trả cuốn sách mua ở tiệm từ năm 2019, trong đó vẫn kẹp vé xe buýt.\nMình nghĩ sách cũ hay nhất là ở mấy dấu vết kiểu này.\nMọi người từng tìm thấy gì trong một cuốn sách cũ chưa?',
    sr1: 'Một lá thư tay viết năm 1998, đọc mà nổi da gà', sr2: 'Tờ 2 nghìn kẹp làm đánh dấu trang 😂',
    c1t: 'Chi tiết thật → Ý của bạn → Câu hỏi', c1: 'Viết đúng ba dòng khi bí ý.',
  }],
  ['en', E, {
    bad: 'Before: says it all', good: 'After: opens a conversation', three: 'The three-line formula',
    b1: 'May Bakery’s wood-fired bánh mì: crunchy crust, soft inside, delivered in 30 minutes. Order now!',
    g1: 'Day-old bánh mì goes chewy. How do you bring it back? We usually re-toast it for 3 minutes in the air fryer, but there must be a better way.',
    gr1: 'A splash of water and 5 minutes in the oven, crunchy like new', gr2: 'I turn it into garlic butter bread, zero waste 😋',
    s1: 'A student came in this morning with a book they bought from us in 2019, an old bus ticket still tucked inside.\nI think the best part of used books is little traces like this.\nWhat’s the most surprising thing you’ve found in a used book?',
    sr1: 'A handwritten letter from 1998, gave me goosebumps', sr2: 'An old banknote someone used as a bookmark 😂',
    c1t: 'Real detail → your take → question', c1: 'When you’re stuck, write exactly three lines.',
  }],
]) {
  scenes.push({
    file: `viet-bai-${lang}.png`,
    phones: [
      {
        title: '', label: t.bad, labelTone: 'bad', tilt: 'down',
        posts: [{ author: a.may, time: '5h', text: t.b1, counts: { heart: 3 } }],
      },
      {
        title: '', label: t.good, labelTone: 'good', tilt: 'up',
        posts: [
          { author: a.may, time: '5h', text: t.g1, counts: { heart: 167, reply: 52, repost: 9 }, thread: true, mark: true },
          { author: a.u2, time: '4h', text: t.gr1, counts: { heart: 41, reply: 3 }, reply: true },
          { author: a.u1, time: '3h', text: t.gr2, counts: { heart: 26, reply: 2 }, reply: true },
        ],
      },
      {
        title: '', label: t.three,
        posts: [
          { author: a.sach, time: '1h', text: t.s1, counts: { heart: 98, reply: 37, repost: 5 }, thread: true, mark: true },
          { author: a.u3, time: '48m', text: t.sr1, counts: { heart: 22, reply: 1 }, reply: true },
        ],
        callout: { title: t.c1t, text: t.c1 },
      },
    ],
  })
}

export const SCENES = scenes
