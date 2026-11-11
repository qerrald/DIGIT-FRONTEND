/* laporan.html : Pilih data, ambil data, tampilkan laporan (P-SPEC 6.1 - 6.3) - khusus Kepala Sekolah */
'use strict';
var JENIS = { summary: 'Ringkasan', students: 'Data siswa', development: 'Perkembangan anak', attendance: 'Rekap absensi', activities: 'Kegiatan', portfolios: 'Portofolio' };
function dalam(d, dari, sampai) { d = String(d).slice(0, 10); return (!dari || d >= dari) && (!sampai || d <= sampai); }
function tabel(kepala, baris) {
  return '<div class="table-wrap"><table><thead><tr>' + kepala.map(function (k) { return '<th>' + k + '</th>'; }).join('') + '</tr></thead><tbody>' +
    (baris.length ? baris.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + kepala.length + '"><div class="empty">Tidak ada data pada periode ini.</div></td></tr>') + '</tbody></table></div>';
}
/* 6.2 Retrieve data */
function ambil(jenis, dari, sampai) {
  var dev = db.development.filter(function (d) { return dalam(d.record_date, dari, sampai); });
  var att = db.attendance.filter(function (a) { return dalam(a.attendance_date, dari, sampai); });
  var act = db.activities.filter(function (a) { return dalam(a.activity_date, dari, sampai); });
  var por = db.portfolios.filter(function (p) { return dalam(p.uploaded_at, dari, sampai); });
  return { dev: dev, att: att, act: act, por: por };
}
/* 6.3 Generate report */
function bagian(jenis, data) {
  if (jenis === 'students') return tabel(['Nama', 'NIS', 'Kelas', 'Jenis kelamin', 'Status'], db.students.map(function (s) { return [esc(s.full_name), esc(s.student_number), esc(s.class_name), L.gender[s.gender], L.student_status[s.status]]; }));
  if (jenis === 'development') return tabel(['Tanggal', 'Siswa', 'Aspek', 'Penilaian', 'Status'], data.dev.map(function (d) { return [tgl(d.record_date), esc(siswa(d.student_id).full_name), esc(d.development_aspect), esc(d.assessment), L.verification_status[d.verification_status]]; }));
  if (jenis === 'attendance') return tabel(['Siswa', 'Kelas', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Total'], db.students.map(function (s) {
    var r = data.att.filter(function (a) { return a.student_id === s.student_id; }), c = function (k) { return r.filter(function (a) { return a.attendance_status === k; }).length; };
    return [esc(s.full_name), esc(s.class_name), c('present'), c('excused'), c('sick'), c('absent'), r.length]; }));
  if (jenis === 'activities') return tabel(['Tanggal', 'Kegiatan', 'Deskripsi', 'Jumlah karya'], data.act.map(function (a) { return [tgl(a.activity_date), esc(a.activity_name), esc(a.description), db.portfolios.filter(function (p) { return p.activity_id === a.activity_id; }).length]; }));
  if (jenis === 'portfolios') return tabel(['Diunggah', 'Judul', 'Kegiatan', 'Untuk', 'Status'], data.por.map(function (p) { return [tgl(p.uploaded_at), esc(p.title), esc(kegiatan(p.activity_id).activity_name), esc(targetPorto(p)), L.verification_status[p.verification_status]]; }));
  return '';
}
function tampilkan(jenis, dari, sampai) {
  var data = ambil(jenis, dari, sampai), html = '';
  var judul = function (t) { return '<h3 style="margin:14px 0 8px;color:var(--red-dark)">' + t + '</h3>'; };
  if (jenis === 'summary') {
    var ok = function (l) { return l.filter(function (x) { return x.verification_status === 'approved'; }).length; };
    html += '<div class="summary-grid">' + [['Siswa aktif', db.students.filter(function (s) { return s.status === 'active'; }).length], ['Catatan perkembangan', data.dev.length], ['Disetujui', ok(data.dev)], ['Catatan absensi', data.att.length],
      ['Kegiatan', data.act.length], ['Portofolio', data.por.length]].map(function (x) { return '<div class="stat"><b>' + x[1] + '</b><span>' + x[0] + '</span></div>'; }).join('') + '</div>';
    ['attendance', 'development'].forEach(function (j) { html += judul(JENIS[j === 'attendance' ? 'attendance' : 'development']) + bagian(j, data); });
  } else html += bagian(jenis, data);
  return html;
}
(function () {
  if (!U) return;
  var sel = $('#jenis'); sel.innerHTML = Object.keys(JENIS).map(function (k) { return '<option value="' + k + '">' + JENIS[k] + '</option>'; }).join('');
  $('#form-laporan').onsubmit = function (e) {
    e.preventDefault();
    var jenis = sel.value, dari = $('#dari').value, sampai = $('#sampai').value;
    if (dari && sampai && dari > sampai) { var er = $('#lap-error'); er.textContent = 'Tanggal awal tidak boleh melebihi tanggal akhir.'; er.hidden = false; return; }
    $('#lap-error').hidden = true;
    $('#hasil').innerHTML = '<div class="card report-sec"><h3>Laporan ' + JENIS[jenis] + '</h3><p class="report-meta">Periode: ' + (dari ? tgl(dari) : 'awal') + ' s.d. ' + (sampai ? tgl(sampai) : 'sekarang') + ' · Dibuat oleh ' + esc(U.full_name) + ' · ' + tgl(hariIni()) + '</p>' + tampilkan(jenis, dari, sampai) + '</div>';
    $('#btn-cetak').hidden = false;
  };
  $('#btn-cetak').onclick = function () { window.print(); };
})();
