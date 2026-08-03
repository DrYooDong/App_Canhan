// ============================================
// NỘI TÂM — Thư Viện Cổ Tịch Tử Vi Kinh Điển (Cốt Tủy Phú, Toàn Thư)
// Nguồn: 明代刊本 《骨髓赋》《紫微斗数全书》《紫微斗数全集》
// ============================================

window.ZiweiClassics = (function() {
  'use strict';

  const BOOKS = [
    {
      id: 'gusuifu',
      title: 'Cốt Tủy Phú (骨髓赋)',
      dynasty: 'Triều Minh',
      author: 'Cổ Tích Truyền Thừa (Vô danh gia)',
      intro: 'Bài ca quyết cốt lõi và đắc giá nhất của Tử Vi Đẩu Số (khoảng 1500 chữ). Ni Hải Hạ trong 《Thiên Kỷ》 nhiều lần trích dẫn bài phú này.',
      chapters: [
        {
          title: 'Chương 1: Tổng Luận',
          paragraphs: [
            'Thái Cực tinh diệu, nãi quần tinh chi chủ. Tử Vi đế tọa, vi chúng tinh chi tôn. Thiên Phủ lệnh tinh, Nam Bắc Đẩu Hóa Lộc, Hóa Quyền; Tả Phù Hữu Bật, chủ tế tự chi tinh.',
            'Tử Vi vi quân, dĩ Tả Phù Hữu Bật vi tướng. Thiên Phủ vi thần, dĩ Lộc Tồn vi phủ khố. Thiên Cơ vi thiện, Thiên Lương vi ấm, ngộ chi tắc cát; Liêm Trinh vi tù, Phá Quân vi hao, phùng chi tắc hung.',
            'Xem mệnh chi yếu, tiên khán Cung Mệnh. Cung Mệnh chủ tinh định kỳ cách cục, Tam Phương Tứ Chính định kỳ dụng võ. Thứ khán Cung Thân, Cung Thân định kỳ vãn cảnh dữ y quy.'
          ]
        },
        {
          title: 'Chương 2: Tử Vi Tinh Luận',
          paragraphs: [
            'Tử Vi vi đế tọa chi tinh, đắc Phụ Bật tắc quý, đắc Xương Khúc tắc tú, đắc Khôi Việt tắc quý nhân phò trì. Tử Vi độc tọa vô phụ, túng quý bất cửu.',
            'Tử Vi ở Tý Ngọ vi "Mặt Nam Lưng Bắc" chi quý, chủ đại phú đại quý; Tử Vi ở Sửu Mùi dữ Phá Quân đồng cung, chủ cương nghị quả quyết; Tử Vi ở Dần Thân dữ Thiên Phủ đồng cung, xưng "Tử Phủ Đồng Cung" cách, chủ phẩm đoan y thực phong túc.',
            'Tử Vi cư Quan Lộc, vô sát trùng phá, tất vi cao quan; Tử Vi cư Điền Trạch, chủ hữu tổ nghiệp, hựu năng tự trí; Tử Vi cư Phu Thê, chủ phối ngẫu đoan trang, khí chất bất phàm, đản nghi trì hôn bất nghi tảo.'
          ]
        },
        {
          title: 'Chương 3: Cát Hung Định Cách',
          paragraphs: [
            'Tham Lang ngộ Hỏa Linh, tất phát hoành tài; Vũ Tham bất phát thiếu niên nhân, trung niên đại phát.',
            'Thất Sát cư Phu Thê uyên uyên bán lạnh; Liêm Phá cư Phu Thê thủy trung tác mộ.',
            'Phủ Tướng triều viên thiên chung thực lộc; Dương Lương Xương Lộc khoa bảng danh cao.'
          ]
        }
      ]
    },
    {
      id: 'quanshu',
      title: 'Tử Vi Đẩu Số Toàn Thư (紫微斗数全书)',
      dynasty: 'Triều Minh',
      author: 'Trần Hy Di (Chủ biên: La Hồng Tiên)',
      intro: 'Tác phẩm toàn thư kinh điển nhất lưu truyền từ Trần Hy Di Tổ Sư, là nền móng nhập môn và nâng cao của Tử Vi Nam Bái.',
      chapters: [
        {
          title: 'Chương 1: Khởi Nguyên & Tinh Diệu Tính Chất',
          paragraphs: [
            'Đẩu Số nguồn gốc từ Hà Đồ Lạc Thư, phối hợp Ngũ Hành Âm Dương, phân định 12 Cung Bàn Số.',
            'Mệnh vô chính diệu, mượn đối cung chính tinh chiếu sang làm dụng; Tam phương tứ chính hội hợp cát sát quyết định thượng trung hạ cách.'
          ]
        }
      ]
    }
  ];

  function getBooks() {
    return BOOKS;
  }

  function getBookById(id) {
    return BOOKS.find(b => b.id === id) || BOOKS[0];
  }

  function searchClassics(keyword) {
    if (!keyword) return [];
    const kw = keyword.toLowerCase();
    const results = [];

    BOOKS.forEach(book => {
      book.chapters.forEach(chap => {
        chap.paragraphs.forEach(para => {
          if (para.toLowerCase().includes(kw)) {
            results.push({
              bookTitle: book.title,
              chapterTitle: chap.title,
              text: para
            });
          }
        });
      });
    });

    return results;
  }

  return {
    getBooks,
    getBookById,
    searchClassics
  };
})();
