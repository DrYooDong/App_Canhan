// ============================================
// NỘI TÂM — Dữ liệu mẫu
// Bài học, Quy luật, Lời nhắc, Nhật ký
// ============================================

const SAMPLE_LESSONS = [
  {
    id: 'l1',
    title: 'Kiên nhẫn là vũ khí của kẻ mạnh',
    content: 'Trong mọi tình huống, kiên nhẫn luôn mang lại kết quả tốt hơn sự vội vàng. Khi bạn cảm thấy muốn bỏ cuộc, hãy nhớ rằng "Hỏa nung Kim" — lửa tôi luyện vàng. Mọi áp lực đều đang rèn giũa bạn thành phiên bản tốt hơn.',
    tags: ['kiên-nhẫn', 'kỷ-luật', 'vượt-khó'],
    relatedStrength: 'vượt-khó',
    relatedWeakness: 'thiếu-kiên-định',
    createdAt: '2026-07-01T08:00:00',
    source: 'Trải nghiệm cá nhân'
  },
  {
    id: 'l2',
    title: 'Nhu thắng cương trong mọi cuộc tranh luận',
    content: 'Không bao giờ cố thắng bằng sự áp đặt. Hãy lắng nghe, thấu hiểu, rồi trình bày quan điểm bằng sự chân thành. Người ta sẽ tự nguyện đồng ý với bạn khi họ cảm nhận được sự tôn trọng. Đây chính là quyền lực mềm — thứ vũ khí mạnh nhất mà bạn sở hữu.',
    tags: ['giao-tiếp', 'nhu-thắng-cương', 'quyền-lực-mềm'],
    relatedStrength: 'ngoại-giao-tuyệt-đỉnh',
    relatedWeakness: '',
    createdAt: '2026-07-05T10:30:00',
    source: 'Đọc sách'
  },
  {
    id: 'l3',
    title: 'Quyết định nhanh, hành động ngay',
    content: 'Nhận ra rằng sự phân vân kéo dài chỉ tiêu hao năng lượng mà không tạo ra giá trị. Đặt deadline cho mọi quyết định: 10 phút cho việc nhỏ, 1 ngày cho việc trung bình, 1 tuần cho việc lớn. Sau deadline, chọn phương án tốt nhất có thể và hành động ngay.',
    tags: ['quyết-đoán', 'hành-động', 'kỷ-luật'],
    relatedStrength: '',
    relatedWeakness: 'bất-quyết',
    createdAt: '2026-07-10T14:00:00',
    source: 'Tự phản tư'
  },
  {
    id: 'l4',
    title: 'Giá trị của sự im lặng',
    content: 'Không phải lúc nào cũng cần nói. Đôi khi, sự im lặng mang nhiều sức mạnh hơn ngàn lời. Im lặng để quan sát, để hiểu, để tìm thời cơ đúng đắn. Thiên Cơ và Thiên Lương trong lá số nhắc nhở: mưu trí nằm ở sự chờ đợi đúng lúc.',
    tags: ['im-lặng', 'quan-sát', 'mưu-trí'],
    relatedStrength: 'chiến-lược-gia',
    relatedWeakness: '',
    createdAt: '2026-07-12T09:15:00',
    source: 'Sách "Nghệ thuật chiến tranh"'
  },
  {
    id: 'l5',
    title: 'Dòng họ là gốc rễ',
    content: 'Mỗi khi cảm thấy lạc lõng, hãy nhớ về gia đình. Thân cư Phúc Đức — cuộc đời bạn gắn liền với dòng tộc. Chăm lo cho tổ tiên, mồ mả không phải là mê tín, mà là cách bạn kết nối với gốc rễ, tìm lại sự bình yên và sức mạnh nội tâm.',
    tags: ['gia-đình', 'dòng-họ', 'tâm-linh'],
    relatedStrength: 'phúc-lộc',
    relatedWeakness: 'mất-phương-hướng',
    createdAt: '2026-07-14T16:00:00',
    source: 'Tử Vi cá nhân'
  }
];

const SAMPLE_RULES = [
  {
    id: 'r1',
    title: 'Quy luật Reciprocity — Có đi có lại',
    content: 'Con người luôn cảm thấy "nợ" khi nhận được điều gì đó. Hãy cho đi trước — kiến thức, sự giúp đỡ, sự tôn trọng — và bạn sẽ nhận lại gấp bội. Đây là nguyên tắc mạnh nhất trong xây dựng quan hệ.',
    category: 'quan-hệ',
    tags: ['quan-hệ', 'cho-đi', 'tâm-lý-học'],
    createdAt: '2026-07-02T08:00:00',
    source: 'Robert Cialdini — Influence'
  },
  {
    id: 'r2',
    title: 'Quy luật 80/20 trong Công việc',
    content: '80% kết quả đến từ 20% nỗ lực quan trọng nhất. Xác định đâu là 20% công việc tạo ra giá trị lớn nhất và tập trung tối đa vào đó. Phần còn lại có thể ủy thác hoặc đơn giản hóa.',
    category: 'công-việc',
    tags: ['công-việc', 'hiệu-suất', 'pareto'],
    createdAt: '2026-07-03T10:00:00',
    source: 'Richard Koch — The 80/20 Principle'
  },
  {
    id: 'r3',
    title: 'Quyền lực đến từ vị trí, không phải lời nói',
    content: 'Đừng đòi hỏi sự tôn trọng bằng lời. Hãy xây dựng giá trị bản thân, tích lũy uy tín qua hành động. Khi bạn đã ở vị trí đủ cao, lời nói của bạn tự nhiên có trọng lượng. Đây chính là "quyền lực mềm" mà lá số bạn đề cập.',
    category: 'quyền-lực',
    tags: ['quyền-lực', 'uy-tín', 'vị-trí'],
    createdAt: '2026-07-06T14:30:00',
    source: 'Tự chiêm nghiệm'
  },
  {
    id: 'r4',
    title: 'Cảm xúc là kẻ phá hoại quyết định',
    content: 'Không bao giờ đưa ra quyết định quan trọng khi đang tức giận, phấn khích quá mức hoặc chán nản. Đợi 24 giờ. Nếu sau 24 giờ vẫn nghĩ giống, thì đó là quyết định đúng.',
    category: 'cảm-xúc',
    tags: ['cảm-xúc', 'quyết-định', 'kỷ-luật'],
    createdAt: '2026-07-08T09:00:00',
    source: 'Stoicism — Marcus Aurelius'
  },
  {
    id: 'r5',
    title: 'Kỷ luật thắng động lực',
    content: 'Động lực đến rồi đi, nhưng kỷ luật luôn ở đó. Hãy xây dựng hệ thống thói quen thay vì phụ thuộc vào cảm hứng. Mỗi ngày làm một ít, nhất quán, "tích tiểu thành đại" — đúng như quỹ đạo tài chính trong lá số.',
    category: 'kỷ-luật',
    tags: ['kỷ-luật', 'thói-quen', 'kiên-trì'],
    createdAt: '2026-07-09T07:30:00',
    source: 'James Clear — Atomic Habits'
  }
];

const SAMPLE_REMINDERS = [
  {
    id: 'rm1',
    title: 'Khi mất phương hướng',
    content: 'Hãy dừng lại. Hít thở. Nhớ lại: "Tôi là ai" — một người nhân hậu, trí tuệ, có phúc tinh Thiên Đồng che chở. Mọi khó khăn đều sẽ qua. Quý nhân luôn xuất hiện đúng lúc.',
    mood: 'mất-phương-hướng',
    tags: ['bình-tĩnh', 'thiên-đồng', 'quý-nhân'],
    createdAt: '2026-07-01T06:00:00'
  },
  {
    id: 'rm2',
    title: 'Khi muốn bỏ cuộc',
    content: '"Nước chảy đá mòn" — bạn không cần nhanh, bạn chỉ cần không dừng lại. Tiền vận gian truân chính là lửa tôi luyện. Hậu vận phú quý đang đợi bạn ở phía trước. 8/10 — lá số của bạn rất đẹp, đừng phí hoài nó.',
    mood: 'muốn-bỏ-cuộc',
    tags: ['kiên-trì', 'hậu-vận', 'lá-số-đẹp'],
    createdAt: '2026-07-02T06:00:00'
  },
  {
    id: 'rm3',
    title: 'Khi cảm thấy cô đơn',
    content: 'Bạn không bao giờ thực sự một mình. Thân cư Phúc Đức — dòng họ bạn luôn ở bên, dù hữu hình hay vô hình. Anh chị em Thiên Phủ — hòa thuận, đùm bọc. Phối ngẫu Cơ Lương — quân sư hậu phương. Bạn được bao bọc bởi tình yêu thương.',
    mood: 'cô-đơn',
    tags: ['gia-đình', 'tình-yêu', 'không-cô-đơn'],
    createdAt: '2026-07-03T06:00:00'
  },
  {
    id: 'rm4',
    title: 'Khi bị áp lực công việc',
    content: 'Nhớ rằng bạn là chiến lược gia, không phải chiến binh xung trận. Hãy lùi lại một bước, phân tích bình tĩnh. Thiên Cơ cho bạn mưu trí, Thiên Lương cho bạn sự ổn định. Dùng trí thay vì dùng sức.',
    mood: 'áp-lực',
    tags: ['công-việc', 'chiến-lược', 'bình-tĩnh'],
    createdAt: '2026-07-04T06:00:00'
  },
  {
    id: 'rm5',
    title: 'Khi dao động về quyết định',
    content: 'Tâm lý "bất quyết" là điểm yếu lớn nhất của bạn — NHƯNG bạn đã nhận ra nó. Và nhận ra là bước đầu tiên để vượt qua. Hãy đặt deadline, chọn phương án tốt nhất, rồi HÀNH ĐỘNG. Không có quyết định hoàn hảo, chỉ có quyết định đúng lúc.',
    mood: 'dao-động',
    tags: ['quyết-đoán', 'hành-động', 'vượt-qua-bất-quyết'],
    createdAt: '2026-07-05T06:00:00'
  },
  {
    id: 'rm6',
    title: 'Lời nhắc buổi sáng',
    content: '"Hãy cứ giữ vững tấm lòng thiện lương, dùng trí tuệ tham mưu để cống hiến, và kiên nhẫn bước qua những ngọn lửa thử thách." — Mỗi ngày mới là một cơ hội để trở thành phiên bản tốt hơn.',
    mood: 'hằng-ngày',
    tags: ['buổi-sáng', 'thiện-lương', 'kiên-nhẫn'],
    createdAt: '2026-07-06T06:00:00'
  }
];

const SAMPLE_JOURNALS = [
  {
    id: 'j1',
    title: 'Ngày đầu tiên sử dụng hệ thống',
    content: 'Hôm nay tôi bắt đầu xây dựng thư viện tri thức cá nhân. Đọc lại toàn bộ lá số Tử Vi, tôi thấy rất nhiều điều trùng khớp với cuộc sống hiện tại. Đặc biệt là phần "bất quyết" — đúng là tôi hay phân vân quá lâu trước các quyết định. Mục tiêu tuần này: rèn luyện quyết đoán hơn.',
    tags: ['khởi-đầu', 'tự-nhận-thức', 'mục-tiêu'],
    mood: '🤔',
    prompt: 'Bạn có nhận ra điểm yếu nào đang ảnh hưởng đến cuộc sống hàng ngày không?',
    createdAt: '2026-07-14T21:00:00'
  },
  {
    id: 'j2',
    title: 'Suy ngẫm về sự kiên nhẫn',
    content: 'Tuần này có một dự án bị trì hoãn và tôi suýt muốn bỏ. Nhưng rồi nhớ lại "Hỏa nung Kim" — áp lực là để tôi luyện. Tôi quyết định tiếp tục, chia nhỏ công việc thành từng bước. Kết quả: hoàn thành 70% và cảm thấy tự hào.',
    tags: ['kiên-nhẫn', 'dự-án', 'vượt-khó'],
    mood: '💪',
    prompt: 'Khi gặp khó khăn, bạn thường phản ứng thế nào? Có giống với mô tả trong Tử Vi không?',
    createdAt: '2026-07-13T22:30:00'
  }
];

const MOOD_OPTIONS = [
  { value: 'mất-phương-hướng', label: '😶‍🌫️ Mất phương hướng', color: '#6a6878' },
  { value: 'muốn-bỏ-cuộc', label: '😩 Muốn bỏ cuộc', color: '#c45a5a' },
  { value: 'cô-đơn', label: '🥀 Cô đơn', color: '#7a5ac4' },
  { value: 'áp-lực', label: '😤 Áp lực', color: '#c4a95a' },
  { value: 'dao-động', label: '🌊 Dao động', color: '#5a8fc4' },
  { value: 'hằng-ngày', label: '☀️ Hằng ngày', color: '#c9a96e' },
  { value: 'tích-cực', label: '✨ Tích cực', color: '#5bc47a' }
];

const RULE_CATEGORIES = [
  { value: 'quan-hệ', label: '🤝 Quan hệ', color: '#5a8fc4' },
  { value: 'công-việc', label: '💼 Công việc', color: '#c9a96e' },
  { value: 'quyền-lực', label: '👑 Quyền lực', color: '#c47a5a' },
  { value: 'cảm-xúc', label: '💭 Cảm xúc', color: '#7a5ac4' },
  { value: 'kỷ-luật', label: '⚔️ Kỷ luật', color: '#5bc47a' },
  { value: 'tài-chính', label: '💰 Tài chính', color: '#c4a95a' }
];

const JOURNAL_PROMPTS = [
  'Hôm nay bạn có thấy mình bất quyết trong việc gì không?',
  'Bạn đã giúp đỡ ai hôm nay? Cảm giác như thế nào?',
  'Điều gì khiến bạn cảm thấy "chóng chán" gần đây?',
  'Bạn có đang kiên trì với mục tiêu lớn nào không?',
  'Mối quan hệ nào trong gia đình cần bạn chú ý hơn?',
  'Bạn có nhận ra sự che chở từ quý nhân nào gần đây?',
  'Hôm nay bạn đã dùng "nhu thắng cương" trong tình huống nào?',
  'Bạn đã rèn luyện ý chí kim cương như thế nào hôm nay?',
  'Điều gì từ Tử Vi mà bạn muốn chiêm nghiệm thêm?',
  'Bạn có cảm nhận được sự kết nối với dòng họ hôm nay không?',
  'Nếu phải đưa ra một quyết định quan trọng hôm nay, bạn sẽ chọn gì?',
  'Điểm mạnh nào của bạn đã phát huy tác dụng hôm nay?',
  'Bạn đã đọc/học được gì mới hôm nay?',
  'Bạn có đang sống đúng với cốt cách "nhân hậu, trí tuệ" không?'
];

// Export
window.SAMPLE_LESSONS = SAMPLE_LESSONS;
window.SAMPLE_RULES = SAMPLE_RULES;
window.SAMPLE_REMINDERS = SAMPLE_REMINDERS;
window.SAMPLE_JOURNALS = SAMPLE_JOURNALS;
window.MOOD_OPTIONS = MOOD_OPTIONS;
window.RULE_CATEGORIES = RULE_CATEGORIES;
window.JOURNAL_PROMPTS = JOURNAL_PROMPTS;
