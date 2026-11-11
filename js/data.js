/* DIGIT - data.js
   Penyimpanan data di localStorage. Nama tabel dan kolom SAMA dengan ERD DIGIT
   (roles, users, admins, students, student_guardians, development, attendance, activities, portfolios).
   Catatan: password_hash di sini hanya simulasi; hash sebenarnya dilakukan oleh backend. */
'use strict';
var KEY = 'digit_data_v3', SESSION = 'digit_user_id';

var ROLE = { 1: 'Admin', 2: 'Guru', 3: 'Orang Tua', 4: 'Kepala Sekolah' };           // roles.role_id -> role_name
var HOME = { 1: 'dashboard-admin.html', 2: 'dashboard-guru.html', 3: 'dashboard-ortu.html', 4: 'dashboard-kepsek.html' };
var ASPEK = ['Agama & Moral', 'Kognitif', 'Bahasa', 'Motorik Kasar', 'Motorik Halus', 'Sosial-Emosional', 'Seni'];
var L = {                                                                            // label enum ERD
  account_status: { active: 'Aktif', inactive: 'Nonaktif', pending: 'Menunggu', rejected: 'Ditolak' },
  student_status: { active: 'Aktif', inactive: 'Nonaktif' },
  gender: { male: 'Laki-laki', female: 'Perempuan' },
  relationship: { father: 'Ayah', mother: 'Ibu', guardian: 'Wali' },
  attendance_status: { present: 'Hadir', excused: 'Izin', sick: 'Sakit', absent: 'Alpha' },
  verification_status: { pending: 'Menunggu', approved: 'Disetujui', revision: 'Perlu revisi' }
};

function hash(s) { var h = 2166136261; s = 'digit|' + s; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return 'h$' + h.toString(16); }

function seed() {
  return {
    roles: [
      { role_id: 1, role_name: 'Admin', description: 'Mengelola akun dan data induk sekolah' },
      { role_id: 2, role_name: 'Guru', description: 'Mencatat perkembangan, absensi, kegiatan, dan portofolio' },
      { role_id: 3, role_name: 'Orang Tua', description: 'Memantau perkembangan anak' },
      { role_id: 4, role_name: 'Kepala Sekolah', description: 'Memverifikasi dan membuat laporan' }],
    users: [
      { user_id: 1, role_id: 1, full_name: 'Administrator TK', username: 'admin', email: 'admin@tk-telkom.local', password_hash: hash('admin123'), status: 'active', must_change_password: false },
      { user_id: 2, role_id: 2, full_name: 'Bu Rina Wulandari', username: 'guru', email: 'guru@tk-telkom.local', password_hash: hash('guru123'), status: 'active', must_change_password: false },
      { user_id: 3, role_id: 3, full_name: 'Ibu Sari Dewi', username: 'ortu', email: 'ortu@tk-telkom.local', password_hash: hash('ortu123'), status: 'active', must_change_password: false },
      { user_id: 4, role_id: 4, full_name: 'Ibu Hj. Maria Kusuma', username: 'kepsek', email: 'kepsek@tk-telkom.local', password_hash: hash('kepsek123'), status: 'active', must_change_password: false },
      { user_id: 5, role_id: 2, full_name: 'Pak Dani Setiawan', username: 'guru2', email: 'dani@tk-telkom.local', password_hash: hash('guru2123'), status: 'pending', must_change_password: false }],
    admins: [{ admin_id: 1, user_id: 1, nip: '-', position: 'Administrator TK' }],
    students: [
      { student_id: 1, student_number: '1001', full_name: 'Aisyah Putri', birth_date: '2020-03-14', gender: 'female', class_name: 'TK A', status: 'active' },
      { student_id: 2, student_number: '1002', full_name: 'Bima Pratama', birth_date: '2020-07-02', gender: 'male', class_name: 'TK A', status: 'active' },
      { student_id: 3, student_number: '1003', full_name: 'Citra Lestari', birth_date: '2019-11-21', gender: 'female', class_name: 'TK B', status: 'active' }],
    student_guardians: [{ student_id: 1, user_id: 3, relationship: 'mother' }],
    development: [
      { development_id: 1, student_id: 1, created_by: 2, verified_by: 4, record_date: '2026-10-20', development_aspect: 'Bahasa', assessment: 'Mulai mengenal huruf vokal dan dapat menyebutkan nama benda di sekitar.', verification_status: 'approved', revision_note: '' },
      { development_id: 2, student_id: 1, created_by: 2, verified_by: null, record_date: '2026-10-27', development_aspect: 'Motorik Halus', assessment: 'Dapat menggunting mengikuti garis lurus dengan rapi.', verification_status: 'pending', revision_note: '' },
      { development_id: 3, student_id: 2, created_by: 2, verified_by: 4, record_date: '2026-10-22', development_aspect: 'Sosial-Emosional', assessment: 'Mau berbagi mainan dengan teman.', verification_status: 'approved', revision_note: '' }],
    attendance: [
      { attendance_id: 1, student_id: 1, recorded_by: 2, attendance_date: '2026-10-26', attendance_status: 'present', notes: '' },
      { attendance_id: 2, student_id: 1, recorded_by: 2, attendance_date: '2026-10-27', attendance_status: 'sick', notes: 'Demam' },
      { attendance_id: 3, student_id: 2, recorded_by: 2, attendance_date: '2026-10-26', attendance_status: 'present', notes: '' }],
    activities: [
      { activity_id: 1, created_by: 2, activity_name: 'Mewarnai bersama', activity_date: '2026-10-21', description: 'Kegiatan mewarnai gambar hewan untuk melatih motorik halus.' },
      { activity_id: 2, created_by: 2, activity_name: 'Hari Kartini', activity_date: '2026-10-28', description: 'Peringatan Hari Kartini dengan pakaian adat.' }],
    portfolios: [],
    next: 100
  };
}
function normalisasi(d) {
  d.comments = d.comments || [];
  d.student_reports = d.student_reports || [];
  d.students.forEach(function (s) { if (typeof s.photo_url === 'undefined') s.photo_url = ''; });
  d.users.forEach(function (u) { if (typeof u.teacher_class === 'undefined') u.teacher_class = ''; });
  d.next = d.next || 100;
  return d;
}
function load() {
  try { var d = JSON.parse(localStorage.getItem(KEY)); if (d && d.users) return normalisasi(d); } catch (e) {}
  var s = seed(); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} return normalisasi(s);
}
var db = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { toast('Penyimpanan penuh. Gunakan gambar yang lebih kecil.', true); }
}
function newId() { return db.next++; }

/* ----- fungsi bantu umum ----- */
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function tgl(s) { if (!s) return '-'; var p = String(s).slice(0, 10).split('-'); return p[2] + ' ' + BULAN[+p[1] - 1] + ' ' + p[0]; }
function hariIni() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function waktuSekarang() { var d = new Date(); return hariIni() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0'); }
function cari(list, field, id) { return list.find(function (x) { return x[field] === +id; }); }
function siswa(id) { return cari(db.students, 'student_id', id) || { full_name: '(dihapus)', class_name: '-' }; }
function pengguna(id) { return cari(db.users, 'user_id', id) || { full_name: '-' }; }
function kegiatan(id) { return cari(db.activities, 'activity_id', id) || { activity_name: '(dihapus)' }; }
function badge(kind, v) {
  var cls = { pending: 'b-pending', approved: 'b-approved', revision: 'b-revision', active: 'b-approved', rejected: 'b-revision', present: 'b-approved', absent: 'b-revision', sick: 'b-neutral', excused: 'b-pending', inactive: 'b-neutral' }[v] || 'b-neutral';
  return '<span class="badge ' + cls + '">' + esc(L[kind][v] || v) + '</span>';
}
function toast(msg, bad) {
  var box = $('#toast'); if (!box) return;
  var t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = msg;
  box.appendChild(t); setTimeout(function () { t.remove(); }, 3500);
}
function user() { var id = +sessionStorage.getItem(SESSION); return db.users.find(function (u) { return u.user_id === id; }); }

/* ----- aturan hak lihat (selaras P-SPEC 1.2, 3.3, 4.3, 5.4) ----- */
function anakIds(u) { return db.student_guardians.filter(function (g) { return g.user_id === u.user_id; }).map(function (g) { return g.student_id; }); }
function kelasGuru() { var u = user(); return u && u.role_id === 2 ? (u.teacher_class || sessionStorage.getItem('digit_teacher_class_' + u.user_id) || '') : ''; }
function simpanKelasGuru(k) { var u = user(); if (!u || u.role_id !== 2) return; u.teacher_class = k; sessionStorage.setItem('digit_teacher_class_' + u.user_id, k); save(); }
function siswaBoleh() {
  var u = user(); if (!u) return [];
  if (u.role_id === 3) { var ids = anakIds(u); return db.students.filter(function (s) { return ids.indexOf(s.student_id) >= 0; }); }
  if (u.role_id === 2) { var k = kelasGuru(); return k ? db.students.filter(function (s) { return s.class_name === k; }) : []; }
  return db.students;
}
function idBoleh() { return siswaBoleh().map(function (s) { return s.student_id; }); }
function dataBoleh(list, perluVerifikasi) {   /* orang tua: hanya anaknya; perkembangan harus APPROVED */
  var u = user(), ids = idBoleh();
  return list.filter(function (r) { return ids.indexOf(r.student_id) >= 0 && (!perluVerifikasi || u.role_id !== 3 || r.verification_status === 'approved'); });
}
function portofolioBoleh() {   /* orang tua: APPROVED untuk anaknya atau kelas anaknya */
  var u = user(); if (u.role_id === 2) { var kg = kelasGuru(); return db.portfolios.filter(function (p) { return !kg || (p.student_id && siswa(p.student_id).class_name === kg) || p.class_name === kg; }); } if (u.role_id !== 3) return db.portfolios;
  var ids = idBoleh(), kelas = siswaBoleh().map(function (s) { return s.class_name; });
  return db.portfolios.filter(function (p) { return p.verification_status === 'approved' && ((p.student_id && ids.indexOf(p.student_id) >= 0) || (p.class_name && kelas.indexOf(p.class_name) >= 0)); });
}
function daftarKelas() { var k = []; db.students.forEach(function (s) { if (k.indexOf(s.class_name) < 0) k.push(s.class_name); }); return k.sort(); }
function fotoSiswa(id, cls) { var s = siswa(id); return s.photo_url ? '<img class="student-avatar ' + (cls || '') + '" src="' + esc(s.photo_url) + '" alt="Foto ' + esc(s.full_name) + '">' : '<span class="student-avatar avatar-fallback ' + (cls || '') + '">' + esc((s.full_name || '?').charAt(0).toUpperCase()) + '</span>'; }
function sapaan(u) {
  if (!u) return '';
  if (u.role_id === 2) return 'Bapak/Ibu Guru ' + String(u.full_name || '').replace(/^(Bapak\/Ibu|Bapak|Ibu|Pak|Bu)\.?\s+/i, '');
  if (u.role_id === 3) {
    var g = db.student_guardians.find(function (x) { return x.user_id === u.user_id; });
    var rel = sessionStorage.getItem('digit_login_relationship') || (g && g.relationship) || 'guardian';
    var p = rel === 'father' ? 'Bapak ' : rel === 'mother' ? 'Ibu ' : 'Bapak/Ibu ';
    var nama = String(u.full_name || '').replace(/^(Bapak\/Ibu|Bapak|Ibu)\s+/i, '');
    return p + nama;
  }
  return u.full_name;
}
function umur(birth) { if (!birth) return '-'; var b = new Date(birth + 'T00:00:00'), n = new Date(); var y=n.getFullYear()-b.getFullYear(); if (n.getMonth()<b.getMonth() || (n.getMonth()===b.getMonth() && n.getDate()<b.getDate())) y--; return y + ' tahun'; }
