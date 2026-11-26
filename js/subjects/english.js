/* ============================================================
   MÔN TIẾNG ANH: sẽ bổ sung sau.
   Thêm bài học theo cùng cấu trúc với js/subjects/math.js:
   { id, group, grade, title, theory: [{ t, ex? }], levels: [{ title, icon, build() }] }
   và đặt lang: 'en-US' để phần đọc to dùng giọng tiếng Anh.
   ============================================================ */
window.KE = window.KE || {};
KE.subjects = KE.subjects || [];

KE.subjects.push({
  id: 'tieng-anh',
  name: 'Tiếng Anh',
  icon: '🔤',
  desc: 'Sắp ra mắt',
  lang: 'en-US',
  comingSoon: true,
  groups: [],
  lessons: [],
});
