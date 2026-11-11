/* dashboard-*.html : mengisi angka, grafik, dan daftar. Tiap HTML hanya memuat elemen yang dibutuhkan perannya. */
'use strict';
(function () {
  if (!U) return;
  var flash = sessionStorage.getItem('flash'); if (flash) { toast(flash); sessionStorage.removeItem('flash'); }
  var dev = dataBoleh(db.development, true), att = dataBoleh(db.attendance), set = function (id, v) { var el = $('#' + id); if (el) el.textContent = v; };
  var idsKelas = idBoleh();
  var menunggu = db.development.filter(function (d) { return d.verification_status === 'pending' && (U.role_id !== 2 || idsKelas.indexOf(d.student_id)>=0); }).length +
    db.portfolios.filter(function (p) { return p.verification_status === 'pending' && (U.role_id !== 2 || (p.student_id && idsKelas.indexOf(p.student_id)>=0) || p.class_name===kelasGuru()); }).length +
    (db.student_reports || []).filter(function (r) { return r.status === 'pending' && (U.role_id !== 2 || r.class_name === kelasGuru()); }).length;
  set('nama', sapaan(U));
  set('n-siswa', idBoleh().length); set('n-dev', dev.length); set('n-att', att.length); set('n-menunggu', menunggu);
  set('n-karya', portofolioBoleh().length); set('n-kegiatan', db.activities.length);
  set('n-akun', db.users.length); set('n-akun-menunggu', db.users.filter(function (u) { return u.status === 'pending'; }).length);
  set('n-akun-aktif', db.users.filter(function (u) { return u.status === 'active'; }).length);
  var kelasSel = $('#kelas-guru');
  if (kelasSel && U.role_id === 2) {
    kelasSel.innerHTML = '<option value="">Pilih kelas yang diajar</option>' + daftarKelas().map(function(k){return '<option value="'+esc(k)+'"'+(kelasGuru()===k?' selected':'')+'>'+esc(k)+'</option>';}).join('');
    kelasSel.onchange = function(){ if (!kelasSel.value) return; simpanKelasGuru(kelasSel.value); location.reload(); };
    var ki = $('#kelas-info'); if (ki) ki.textContent = kelasGuru() ? 'Data yang ditampilkan dibatasi untuk ' + kelasGuru() + '.' : 'Pilih kelas terlebih dahulu untuk mulai mengelola data.';
  }

  var pend = $('#akun-menunggu');
  if (pend) {
    var list = db.users.filter(function (u) { return u.status === 'pending'; });
    pend.innerHTML = list.length ? list.map(function (u) { return '<div class="child"><span class="av">' + esc(u.full_name.charAt(0)) + '</span><div><b>' + esc(u.full_name) + '</b><div class="muted">' + ROLE[u.role_id] + ' · ' + esc(u.email) + '</div></div></div>'; }).join('') : '<div class="empty">Tidak ada pendaftaran yang menunggu.</div>';
  }
  var warna = { present: '#16a34a', excused: '#f5b301', sick: '#64748b', absent: '#e31e24' };
  var hit = { present: 0, excused: 0, sick: 0, absent: 0 };
  att.forEach(function (a) { hit[a.attendance_status]++; });
  var total = att.length, acc = 0, stops = [];
  Object.keys(warna).forEach(function (k) { var p = total ? hit[k] / total * 100 : 0; stops.push(warna[k] + ' ' + acc + '% ' + (acc + p) + '%'); acc += p; });
  var donut = $('#donut');
  if (donut) {
    donut.style.background = total ? 'conic-gradient(' + stops.join(',') + ')' : '#eef0f3';
    donut.firstElementChild.textContent = (total ? Math.round(hit.present / total * 100) : 0) + '%';
    $('#legend').innerHTML = Object.keys(warna).map(function (k) { return '<div><i style="background:' + warna[k] + '"></i>' + L.attendance_status[k] + ': ' + hit[k] + '</div>'; }).join('');
  }
  var bars = $('#bars');
  if (bars) {
    var per = ASPEK.map(function (a) { return { a: a, n: dev.filter(function (d) { return d.development_aspect === a; }).length }; });
    var maks = Math.max.apply(null, per.map(function (x) { return x.n; }).concat(1));
    bars.innerHTML = per.map(function (x) { return '<div class="bar"><div class="t"><span>' + esc(x.a) + '</span><span>' + x.n + '</span></div><div class="tr"><i style="width:' + Math.round(x.n / maks * 100) + '%"></i></div></div>'; }).join('');
  }
  var feed = $('#terbaru');
  if (feed) {
    var last = dev.slice().sort(function (a, b) { return b.record_date.localeCompare(a.record_date); }).slice(0, 4);
    feed.innerHTML = last.length ? last.map(function (d) {
      return '<div class="it"><b>' + esc(siswa(d.student_id).full_name) + ' · ' + esc(d.development_aspect) + '</b><p>' + esc(d.assessment) + '</p><span class="muted">' + tgl(d.record_date) + '</span> ' + badge('verification_status', d.verification_status) + '</div>';
    }).join('') : '<div class="empty">Belum ada catatan perkembangan.</div>';
  }
  var kids = $('#anak');
  if (kids) kids.innerHTML = siswaBoleh().map(function (s) {
    var g = db.student_guardians.find(function (x) { return x.student_id === s.student_id && x.user_id === U.user_id; });
    return '<div class="child"><span>' + fotoSiswa(s.student_id) + '</span><div><b>' + esc(s.full_name) + '</b><div class="muted">Kelas ' + esc(s.class_name) + ' · NIS ' + esc(s.student_number) + (g ? ' · ' + L.relationship[g.relationship] : '') + '</div></div></div>';
  }).join('') || '<div class="empty">Belum ada anak yang terhubung.</div>';
  var kartu = $('#anak-kartu');
  if (kartu) kartu.innerHTML = siswaBoleh().map(function(s){
    return '<button class="identity-card" type="button" data-kartu="'+s.student_id+'" aria-label="Lihat kartu identitas '+esc(s.full_name)+'">' +
      '<span class="identity-card-top"><span class="identity-brand">DIGIT <i>•</i> TK TELKOM MOJOKERTO</span><span class="identity-label">IDENTITAS SISWA</span></span>' +
      '<span class="identity-card-main">'+fotoSiswa(s.student_id,'lg')+'<span class="identity-name-wrap"><b>'+esc(s.full_name)+'</b><span class="identity-class">'+esc(s.class_name)+'</span></span></span>' +
      '<span class="identity-card-meta"><span><small>NOMOR INDUK SISWA</small><b>'+esc(s.student_number)+'</b></span><span><small>JENIS KELAMIN</small><b>'+L.gender[s.gender]+'</b></span></span>' +
      '<span class="identity-card-bottom">Lihat kartu identitas <b>→</b></span></button>';
  }).join('') || '<p class="muted">Belum ada siswa terhubung.</p>';
  document.addEventListener('click', function(e){
    var b=e.target.closest('[data-kartu]'); if(!b) return; var s=cari(db.students,'student_id',b.dataset.kartu);
    if(!s) return;
    $('#modal-root').innerHTML='<div class="modal-bg"><div class="modal identity-modal"><div class="identity-detail-head"><div><span class="eyebrow">DIGIT · TK TELKOM MOJOKERTO</span><h3>Kartu Identitas Anak</h3><p class="muted">Informasi peserta didik yang terdaftar.</p></div><button type="button" class="btn ghost sm" data-tutup-kartu aria-label="Tutup">✕</button></div>' +
      '<div class="identity-detail-card"><div class="identity-detail-top"><span>DATA PESERTA DIDIK</span><span class="identity-dot"></span></div><div class="identity-detail-person">'+fotoSiswa(s.student_id,'lg')+'<div><h2>'+esc(s.full_name)+'</h2><p>'+esc(s.class_name)+'</p></div></div>' +
      '<div class="identity-detail-grid"><div><small>NOMOR INDUK SISWA</small><b>'+esc(s.student_number)+'</b></div><div><small>JENIS KELAMIN</small><b>'+L.gender[s.gender]+'</b></div><div><small>TANGGAL LAHIR</small><b>'+tgl(s.birth_date)+'</b></div><div><small>USIA</small><b>'+umur(s.birth_date)+'</b></div></div></div>' +
      '<div class="btns"><button class="btn" data-tutup-kartu>Tutup</button></div></div></div>';
  });
  document.addEventListener('click',function(e){if(e.target.matches('[data-tutup-kartu]'))tutupModal();});
})();
