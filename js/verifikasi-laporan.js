/* Verifikasi laporan semester oleh Kepala Sekolah. */
'use strict';

function labelStatusLaporan(status) {
  return ({ pending: 'Menunggu tinjauan', approved: 'Disetujui', revision: 'Perlu revisi', draft: 'Draft' })[status] || status || 'Belum ada status';
}
function kelasLaporan(r) {
  var st = siswa(r.student_id);
  return (r.class_name || st.class_name || '-') + ' · ' + (r.semester || '-');
}
function kartuLaporan(r, pending) {
  var st = siswa(r.student_id);
  var statusClass = r.status === 'approved' ? 'b-approved' : r.status === 'revision' ? 'b-revision' : 'b-pending';
  var action = pending
    ? '<button class="btn sm" data-tinjau="' + r.report_id + '">Tinjau laporan</button>'
    : '<button class="btn ghost sm" data-lihat="' + r.report_id + '">Lihat laporan</button>';
  return '<article class="review-list-card">' +
    '<div class="review-student">' + fotoSiswa(st.student_id) +
      '<div class="review-student-info"><b>' + esc(st.full_name) + '</b><span class="muted">' + esc(kelasLaporan(r)) + '</span>' +
      '<span class="review-submitted">' + (r.submitted_at ? 'Diajukan ' + tgl(r.submitted_at) : 'Belum ada tanggal pengajuan') + '</span></div>' +
    '</div><div class="review-card-side"><span class="badge ' + statusClass + '">' + esc(labelStatusLaporan(r.status)) + '</span>' + action + '</div>' +
  '</article>';
}
function render() {
  var root = $('#report-content');
  if (!root) return;
  var reports = (db.student_reports || []).slice().sort(function (a, b) {
    return String(b.submitted_at || b.verified_at || '').localeCompare(String(a.submitted_at || a.verified_at || ''));
  });
  var pending = reports.filter(function (r) { return r.status === 'pending'; });
  var history = reports.filter(function (r) { return r.status === 'approved' || r.status === 'revision'; });
  root.innerHTML = '<section class="review-intro"><div><span class="eyebrow">PUSAT TINJAUAN</span><h2>Verifikasi laporan perkembangan anak</h2><p class="muted">Periksa ringkasan perkembangan, kehadiran, dan portofolio sebelum laporan diteruskan kepada orang tua.</p></div>' +
    '<div class="review-count"><b>' + pending.length + '</b><span>Menunggu tinjauan</span></div></section>' +
    '<section class="review-section"><div class="review-section-head"><div><h3>Menunggu tinjauan</h3><p class="muted">Laporan yang telah diajukan oleh guru.</p></div><span class="review-total">' + pending.length + ' laporan</span></div>' +
    (pending.length ? '<div class="review-list">' + pending.map(function (r) { return kartuLaporan(r, true); }).join('') + '</div>' : '<div class="review-empty"><span class="review-empty-icon">✓</span><b>Semua laporan sudah ditinjau</b><p class="muted">Belum ada laporan semester yang menunggu persetujuan.</p></div>') +
    '</section>' +
    '<section class="review-section"><div class="review-section-head"><div><h3>Riwayat tinjauan</h3><p class="muted">Laporan yang sudah disetujui atau dikembalikan untuk revisi.</p></div><span class="review-total">' + history.length + ' laporan</span></div>' +
    (history.length ? '<div class="review-list">' + history.map(function (r) { return kartuLaporan(r, false); }).join('') + '</div>' : '<p class="muted review-history-empty">Belum ada riwayat tinjauan.</p>') +
    '</section><div id="review-panel"></div>';

  root.querySelectorAll('[data-tinjau], [data-lihat]').forEach(function (button) {
    button.onclick = function () {
      var id = button.dataset.tinjau || button.dataset.lihat;
      bukaTinjauan(cari(db.student_reports, 'report_id', id));
    };
  });
}
function bukaTinjauan(r) {
  if (!r) return toast('Laporan tidak ditemukan.', true);
  var canReview = r.status === 'pending';
  var panel = $('#review-panel');
  if (!panel) return;
  panel.innerHTML = '<section class="review-detail">' +
    '<div class="review-detail-head"><div><span class="eyebrow">' + (canReview ? 'TINJAUAN LAPORAN' : 'ARSIP LAPORAN') + '</span><h3>' + esc(siswa(r.student_id).full_name) + '</h3><p class="muted">' + esc(kelasLaporan(r)) + '</p></div>' +
    '<button type="button" class="btn ghost sm" id="tutup-tinjauan">Tutup</button></div>' +
    renderReportCard(r, false) +
    (canReview ? '<div class="review-decision no-print"><div><b>Keputusan Kepala Sekolah</b><p class="muted">Setujui laporan atau kembalikan kepada guru dengan catatan revisi.</p></div><div class="actions"><button class="btn" id="setuju-report">Setujui laporan</button><button class="btn danger" id="revisi-report">Minta revisi</button></div></div>' : '<p class="muted review-history-note">Status saat ini: <b>' + esc(labelStatusLaporan(r.status)) + '</b>' + (r.revision_note ? ' · Catatan revisi: ' + esc(r.revision_note) : '') + '</p>') +
    '</section>';
  $('#tutup-tinjauan').onclick = function () { panel.innerHTML = ''; };
  var approve = $('#setuju-report');
  if (approve) approve.onclick = function () {
    if (r.status !== 'pending') return toast('Laporan ini sudah diproses.', true);
    r.status = 'approved'; r.verified_by = U.user_id; r.verified_at = waktuSekarang(); r.revision_note = '';
    save(); toast('Laporan disetujui dan dapat dilihat orang tua.'); render();
  };
  var revise = $('#revisi-report');
  if (revise) revise.onclick = function () {
    bukaForm('Catatan revisi laporan', [{ name: 'note', label: 'Catatan revisi untuk guru', type: 'textarea', required: true, hint: 'Jelaskan bagian yang perlu dilengkapi atau diperbaiki.' }], {}, function (v) {
      r.status = 'revision'; r.verified_by = U.user_id; r.verified_at = waktuSekarang(); r.revision_note = v.note;
      save(); toast('Laporan dikembalikan kepada guru untuk revisi.');
    });
  };
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
if (U) render();
