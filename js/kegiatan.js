/* kegiatan.html : Input kegiatan (P-SPEC 5.1) */
'use strict';
function render() {
  var guru = U.role_id === 2;
  var rows = db.activities.filter(function(a){ return U.role_id !== 2 || !kelasGuru() || db.portfolios.some(function(p){return p.activity_id===a.activity_id && ((p.student_id && siswa(p.student_id).class_name===kelasGuru()) || p.class_name===kelasGuru());}) || a.class_name===kelasGuru(); }).slice().sort(function (a, b) { return b.activity_date.localeCompare(a.activity_date); });
  $('#rows').innerHTML = rows.length ? rows.map(function (a) {
    var karya = db.portfolios.filter(function (p) { return p.activity_id === a.activity_id; });
    var siswaKegiatan = karya.reduce(function(acc,p){ var list=p.student_id?[siswa(p.student_id)]:db.students.filter(function(s){return s.class_name===p.class_name;}); list.forEach(function(s){if(acc.indexOf(s.student_id)<0)acc.push(s.student_id);}); return acc; },[]);
    if (!siswaKegiatan.length && a.class_name) siswaKegiatan=db.students.filter(function(s){return s.class_name===a.class_name;}).map(function(s){return s.student_id;});
    var n = karya.length;
    return '<tr><td>' + tgl(a.activity_date) + '</td><td><b>' + esc(a.activity_name) + '</b></td><td style="max-width:320px">' + esc(a.description || '-') + '</td><td>' + esc(pengguna(a.created_by).full_name) + '</td><td>' + siswaKegiatan.map(function(id){return fotoSiswa(id);}).join(' ') + '</td><td>' + n + '</td>' +
      (guru ? '<td><button class="btn ghost sm" data-aksi="ubah" data-id="' + a.activity_id + '">Ubah</button></td>' : '') + '</tr>';
  }).join('') : '<tr><td colspan="' + (guru ? 7 : 6) + '"><div class="empty">Belum ada kegiatan.</div></td></tr>';
}
function formKegiatan(a) {
  var baru = !a.activity_id;
  bukaForm(baru ? 'Kegiatan baru' : 'Ubah kegiatan', [
    { name: 'activity_name', label: 'Nama kegiatan', required: true }, { name: 'activity_date', label: 'Tanggal', type: 'date', required: true },
    { name: 'description', label: 'Deskripsi', type: 'textarea' }
  ], a, function (d) {
    d.class_name = U.role_id === 2 ? kelasGuru() : (d.class_name || kelasGuru());
    if (baru) db.activities.push(Object.assign({ activity_id: newId(), created_by: U.user_id }, d)); else Object.assign(a, d);
    save(); toast('Kegiatan disimpan.');
  });
}
(function () {
  if (!U) return;
  $$('.guru-only').forEach(function (el) { el.hidden = U.role_id !== 2; });
  $('#btn-tambah').onclick = function () { formKegiatan({ activity_date: hariIni() }); };
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-aksi]'); if (b) formKegiatan(cari(db.activities, 'activity_id', b.dataset.id)); });
  render();
})();
