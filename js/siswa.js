/* data-siswa.html : Data siswa (P-SPEC 2.1 - 2.4). Admin dan Guru mengelola; Kepala Sekolah hanya melihat. */
'use strict';
function bisaKelola() { return U.role_id === 1 || U.role_id === 2; }
function render() {
  var q = ($('#cari').value || '').toLowerCase(), kelola = bisaKelola();
  var rows = siswaBoleh().filter(function (s) { return (s.full_name + s.student_number).toLowerCase().indexOf(q) >= 0; });
  $('#rows').innerHTML = rows.length ? rows.map(function (s) {
    var wali = db.student_guardians.filter(function (g) { return g.student_id === s.student_id; }).map(function (g) { return pengguna(g.user_id).full_name + ' (' + L.relationship[g.relationship] + ')'; }).join(', ') || '-';
    return '<tr><td><div class="student-cell">' + fotoSiswa(s.student_id) + '<b>' + esc(s.full_name) + '</b></div></td><td>' + esc(s.student_number) + '</td><td>' + esc(s.class_name) + '</td><td>' + L.gender[s.gender] + '</td><td>' + tgl(s.birth_date) + '</td><td>' + esc(wali) + '</td><td>' + badge('student_status', s.status) + '</td>' +
      (kelola ? '<td><div class="actions"><button class="btn ghost sm" data-aksi="ubah" data-id="' + s.student_id + '">Ubah</button><button class="btn danger sm" data-aksi="hapus" data-id="' + s.student_id + '">Hapus</button></div></td>' : '') + '</tr>';
  }).join('') : '<tr><td colspan="8"><div class="empty">Tidak ada data siswa.</div></td></tr>';
}
function formSiswa(s) {
  var baru = !s.student_id;
  bukaForm(baru ? 'Tambah siswa' : 'Ubah siswa', [
    { name: 'full_name', label: 'Nama lengkap', required: true }, { name: 'student_number', label: 'NIS', required: true },
    { name: 'class_name', label: 'Kelas', type: 'select', options: (U.role_id===2 ? [[kelasGuru(),kelasGuru()]] : daftarKelas().map(function(k){return [k,k];})), required: true }, { name: 'birth_date', label: 'Tanggal lahir', type: 'date', required: true },
    { name: 'gender', label: 'Jenis kelamin', type: 'select', options: Object.keys(L.gender).map(function (k) { return [k, L.gender[k]]; }), required: true },
    { name: 'status', label: 'Status', type: 'select', options: Object.keys(L.student_status).map(function (k) { return [k, L.student_status[k]]; }), required: true }, { name: 'photo', label: 'Foto siswa', type: 'file', hint: 'Format JPG/PNG, maksimal 500 KB.' }
  ], baru ? { gender: 'female', status: 'active', class_name: U.role_id===2 ? kelasGuru() : '' } : s, function (d) {
    if (db.students.some(function (x) { return x.student_number === d.student_number && x.student_id !== s.student_id; })) return 'Siswa dengan NIS tersebut sudah terdaftar.';
    if (d.birth_date > hariIni()) return 'Tanggal lahir tidak boleh di masa depan.';
    var simpan = function (photo) {
      var isi = { full_name:d.full_name, student_number:d.student_number, class_name:d.class_name, birth_date:d.birth_date, gender:d.gender, status:d.status };
      if (photo) isi.photo_url = photo;
      if (baru) db.students.push(Object.assign({ student_id:newId(), photo_url:'' }, isi)); else Object.assign(s, isi);
      save(); toast('Data siswa disimpan.');
    };
    if (d.photo) {
      if (!/^image\//.test(d.photo.type) || d.photo.size > 500 * 1024) return 'Foto harus JPG/PNG dan maksimal 500 KB.';
      return new Promise(function (resolve) { var r = new FileReader(); r.onload = function(){ simpan(r.result); resolve(); }; r.onerror = function(){ resolve('Foto gagal dibaca.'); }; r.readAsDataURL(d.photo); });
    }
    simpan(null);
  });
}
(function () {
  if (!U) return;
  var kelola = bisaKelola();
  $$('.kelola-only').forEach(function (el) { el.hidden = !kelola; });
  $('#cari').oninput = render;
  $('#btn-tambah').onclick = function () { formSiswa({}); };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-aksi]'); if (!b) return;
    var s = cari(db.students, 'student_id', b.dataset.id);
    if (b.dataset.aksi === 'ubah') formSiswa(s);
    if (b.dataset.aksi === 'hapus') {
      var dipakai = [db.development, db.attendance, db.portfolios].some(function (l) { return l.some(function (r) { return r.student_id === s.student_id; }); });
      if (dipakai) return toast('Siswa tidak dapat dihapus karena sudah memiliki catatan.', true);
      konfirmasi('Hapus data ' + s.full_name + '?', function () {
        db.students = db.students.filter(function (x) { return x.student_id !== s.student_id; });
        db.student_guardians = db.student_guardians.filter(function (g) { return g.student_id !== s.student_id; }); save(); toast('Siswa dihapus.'); });
    }
  });
  render();
})();
