/* absensi.html : Input, ubah, riwayat absensi (P-SPEC 4.1 - 4.3) */
'use strict';
function render() {
  var f = sessionStorage.getItem('f_att') || '', guru = U.role_id === 2;
  var rows = dataBoleh(db.attendance).filter(function (a) { return !f || String(a.student_id) === f; }).sort(function (a, b) { return b.attendance_date.localeCompare(a.attendance_date); });
  $('#rows').innerHTML = rows.length ? rows.map(function (a) {
    return '<tr><td>' + tgl(a.attendance_date) + '</td><td><div class="student-cell">' + fotoSiswa(a.student_id) + '<b>' + esc(siswa(a.student_id).full_name) + '</b></div></td><td>' + esc(siswa(a.student_id).class_name) + '</td><td>' + badge('attendance_status', a.attendance_status) + '</td><td>' + esc(a.notes || '-') + '</td>' +
      (guru ? '<td><button class="btn ghost sm" data-aksi="ubah" data-id="' + a.attendance_id + '">Ubah</button></td>' : '') + '</tr>';
  }).join('') : '<tr><td colspan="6"><div class="empty">Belum ada catatan absensi.</div></td></tr>';
}
function formAtt(r) {
  var baru = !r.attendance_id;
  bukaForm(baru ? 'Catat absensi' : 'Ubah absensi', [
    { name: 'student_id', label: 'Siswa', type: 'select', options: opsiSiswa(), blank: 'Pilih siswa', required: true },
    { name: 'attendance_date', label: 'Tanggal', type: 'date', required: true },
    { name: 'attendance_status', label: 'Status', type: 'select', options: Object.keys(L.attendance_status).map(function (k) { return [k, L.attendance_status[k]]; }), required: true },
    { name: 'notes', label: 'Keterangan' }
  ], r, function (d) {
    if (d.attendance_date > hariIni()) return 'Tanggal tidak boleh di masa depan.';
    if (db.attendance.some(function (a) { return a.student_id === +d.student_id && a.attendance_date === d.attendance_date && a.attendance_id !== r.attendance_id; })) return 'Absensi siswa pada tanggal tersebut sudah tercatat.';
    var isi = { student_id: +d.student_id, attendance_date: d.attendance_date, attendance_status: d.attendance_status, notes: d.notes };
    if (baru) db.attendance.push(Object.assign({ attendance_id: newId(), recorded_by: U.user_id }, isi)); else Object.assign(r, isi);
    save(); toast('Absensi disimpan.');
  });
}
(function () {
  if (!U) return;
  var guru = U.role_id === 2;
  $$('.guru-only').forEach(function (el) { el.hidden = !guru; });
  pasangFilter('f_att');
  $('#btn-tambah').onclick = function () { formAtt({ attendance_date: hariIni(), attendance_status: 'present' }); };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-aksi]'); if (b && b.dataset.aksi === 'ubah') formAtt(cari(db.attendance, 'attendance_id', b.dataset.id));
  });
  render();
})();
