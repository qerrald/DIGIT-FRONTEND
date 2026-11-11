/* perkembangan.html : Input, ubah, lihat, monitoring (P-SPEC 3.1 - 3.4) dan verifikasi (3.5) */
'use strict';
function render() {
  var f = sessionStorage.getItem('f_dev') || '', guru = U.role_id === 2, aksi = guru || U.role_id === 4;
  var rows = dataBoleh(db.development, true).filter(function (d) { return !f || String(d.student_id) === f; }).sort(function (a, b) { return b.record_date.localeCompare(a.record_date); });
  $('#rows').innerHTML = rows.length ? rows.map(function (d) {
    return '<tr><td>' + tgl(d.record_date) + '</td><td><div class="student-cell">' + fotoSiswa(d.student_id) + '<div><b>' + esc(siswa(d.student_id).full_name) + '</b><div class="muted">oleh ' + esc(pengguna(d.created_by).full_name) + '</div></div></div></td><td>' + esc(d.development_aspect) + '</td><td style="max-width:300px">' + esc(d.assessment) +
      (d.revision_note ? '<div class="note">Revisi: ' + esc(d.revision_note) + '</div>' : '') + '</td><td>' + badge('verification_status', d.verification_status) + '</td>' +
      (aksi ? '<td><div class="actions">' + (guru ? '<button class="btn ghost sm" data-aksi="ubah" data-id="' + d.development_id + '">Ubah</button>' : '') + tombolVerif('dev', d) + '</div></td>' : '') + '</tr>';
  }).join('') : '<tr><td colspan="6"><div class="empty">Belum ada catatan perkembangan.</div></td></tr>';
}
function formDev(r) {
  var baru = !r.development_id;
  bukaForm(baru ? 'Catatan baru' : 'Ubah catatan', [
    { name: 'student_id', label: 'Siswa', type: 'select', options: opsiSiswa(), blank: 'Pilih siswa', required: true },
    { name: 'record_date', label: 'Tanggal', type: 'date', required: true },
    { name: 'development_aspect', label: 'Aspek', type: 'select', options: ASPEK.map(function (a) { return [a, a]; }), blank: 'Pilih aspek', required: true },
    { name: 'assessment', label: 'Penilaian', type: 'textarea', required: true, hint: 'Setelah disimpan, catatan menunggu verifikasi Kepala Sekolah.' }
  ], r, function (d) {
    if (d.record_date > hariIni()) return 'Tanggal tidak boleh di masa depan.';
    var isi = { student_id: +d.student_id, record_date: d.record_date, development_aspect: d.development_aspect, assessment: d.assessment, verification_status: 'pending', verified_by: null, revision_note: '' };
    if (baru) db.development.push(Object.assign({ development_id: newId(), created_by: U.user_id }, isi)); else Object.assign(r, isi);
    save(); toast('Catatan disimpan dan menunggu verifikasi.');
  });
}
(function () {
  if (!U) return;
  var guru = U.role_id === 2, aksi = guru || U.role_id === 4;
  $$('.guru-only').forEach(function (el) { el.hidden = !guru; });
  $$('.aksi-col').forEach(function (el) { el.hidden = !aksi; });
  pasangFilter('f_dev');
  $('#btn-tambah').onclick = function () { formDev({ record_date: hariIni() }); };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-aksi]'); if (!b) return;
    if (b.dataset.aksi === 'ubah') formDev(cari(db.development, 'development_id', b.dataset.id));
    else aksiVerifikasi(b.dataset.aksi, b.dataset.id, b.dataset.tipe);
  });
  render();
})();
