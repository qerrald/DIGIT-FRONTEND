/* portofolio.html : Unggah, kelola, lihat portofolio (P-SPEC 5.2 - 5.4) dan verifikasi (5.5) */
'use strict';
function render() {
  var guru = U.role_id === 2;
  var rows = portofolioBoleh().slice().sort(function (a, b) { return b.uploaded_at.localeCompare(a.uploaded_at); });
  $('#grid').innerHTML = rows.length ? rows.map(function (p) {
    return '<article class="work"><button type="button" class="thumb" data-aksi="lihat" data-id="' + p.portfolio_id + '" aria-label="Lihat gambar ' + esc(p.title) + '"><img src="' + esc(p.file_path) + '" alt="' + esc(p.title) + '"></button><div class="body"><h4>' + esc(p.title) + '</h4>' +
      '<span class="muted">' + esc(kegiatan(p.activity_id).activity_name) + '</span><span class="muted">' + (p.student_id ? fotoSiswa(p.student_id) : (U.role_id===3 ? siswaBoleh() : db.students.filter(function(s){return s.class_name===p.class_name;})).map(function(s){return fotoSiswa(s.student_id);}).join(' ')) + ' ' + esc(targetPorto(p)) + ' · ' + tgl(p.uploaded_at) + '</span><p>' + esc(p.description) + '</p><div>' + badge('verification_status', p.verification_status) + '</div>' +
      (p.revision_note ? '<div class="note">Revisi: ' + esc(p.revision_note) + '</div>' : '') +
      '<div class="actions">' + tombolVerif('por', p) + (guru ? '<button class="btn ghost sm" data-aksi="ubah" data-id="' + p.portfolio_id + '">Ubah</button><button class="btn danger sm" data-aksi="hapus" data-id="' + p.portfolio_id + '">Hapus</button>' : '') + '</div></div></article>';
  }).join('') : '<div class="card empty" style="grid-column:1/-1">Belum ada portofolio.</div>';
}
function perkecil(file) {   /* perkecil gambar lewat canvas agar muat di localStorage */
  return new Promise(function (ok, gagal) {
    var fr = new FileReader(); fr.onerror = gagal;
    fr.onload = function () {
      var img = new Image(); img.onerror = gagal;
      img.onload = function () {
        var k = Math.min(1, 800 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', 0.75));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
function formPor(p) {
  var baru = !p.portfolio_id;
  var nilai = Object.assign({}, p, { target: p.class_name ? 'class' : 'student' });
  bukaForm(baru ? 'Tambah karya' : 'Ubah karya', [
    { name: 'activity_id', label: 'Kegiatan', type: 'select', options: db.activities.map(function (a) { return [a.activity_id, a.activity_name + ' (' + tgl(a.activity_date) + ')']; }), blank: 'Pilih kegiatan', required: true },
    { name: 'title', label: 'Judul', required: true }, { name: 'description', label: 'Deskripsi', type: 'textarea' },
    { name: 'target', label: 'Untuk', type: 'select', options: [['student', 'Satu siswa'], ['class', 'Satu kelas']], required: true },
    { name: 'student_id', label: 'Siswa', type: 'select', options: opsiSiswa(), blank: 'Pilih siswa', required: true, when: { field: 'target', values: ['student'] } },
    { name: 'class_name', label: 'Kelas', type: 'select', options: (U.role_id===2 ? [kelasGuru()] : daftarKelas()).filter(Boolean).map(function (k) { return [k, k]; }), blank: 'Pilih kelas', required: true, when: { field: 'target', values: ['class'] } },
    { name: 'file', label: baru ? 'Foto karya' : 'Ganti foto (opsional)', type: 'file', required: baru, hint: 'Setelah disimpan, karya menunggu verifikasi Kepala Sekolah.' }
  ], nilai, function (d) {
    var meta = { activity_id: +d.activity_id, title: d.title, description: d.description, student_id: d.target === 'student' ? +d.student_id : null, class_name: d.target === 'class' ? d.class_name : null,
      verification_status: 'pending', verified_by: null, revision_note: '' };
    var simpan = function (file, url) {
      if (file) Object.assign(meta, { file_path: url, file_name: file.name, file_type: 'image/jpeg' });
      if (baru) db.portfolios.push(Object.assign({ portfolio_id: newId(), uploaded_by: U.user_id, uploaded_at: waktuSekarang() }, meta)); else Object.assign(p, meta);
      save(); toast('Karya disimpan dan menunggu verifikasi.');
    };
    if (!d.file) { simpan(null); return; }
    if (!/^image\//.test(d.file.type)) return 'File harus berupa gambar.';
    return perkecil(d.file).then(function (url) { simpan(d.file, url); }, function () { return 'Gambar tidak dapat dibaca.'; });
  });
}
(function () {
  if (!U) return;
  $$('.guru-only').forEach(function (el) { el.hidden = U.role_id !== 2; });
  $('#btn-tambah').onclick = function () { formPor({}); };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-aksi]'); if (!b) return;
    var a = b.dataset.aksi;
    if (a === 'lihat') bukaGambar(cari(db.portfolios, 'portfolio_id', b.dataset.id));
    else if (a === 'ubah') formPor(cari(db.portfolios, 'portfolio_id', b.dataset.id));
    else if (a === 'hapus') konfirmasi('Hapus karya ini?', function () { db.portfolios = db.portfolios.filter(function (p) { return p.portfolio_id !== +b.dataset.id; }); save(); toast('Karya dihapus.'); });
    else aksiVerifikasi(a, b.dataset.id, b.dataset.tipe);
  });
  render();
})();
