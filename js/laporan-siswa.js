/* Modul laporan semester terpisah dari halaman lain. */
'use strict';
function laporanSiswa(id, semester) {
  return db.student_reports.find(function(r){return r.student_id===+id && r.semester===semester;});
}
function render() {
  var root=$('#report-content'), semester=periodeSemester();
  if(U.role_id===2){
    var kids=siswaBoleh();
    root.innerHTML='<div class=\"card\"><h3>Kelas '+esc(kelasGuru())+' · Semester '+esc(semester)+'</h3><p class=\"muted\">Pilih siswa untuk menyusun student report card. Setiap laporan harus disimpan sebelum pengajuan verifikasi.</p><div class=\"cards\">'+kids.map(function(s){var r=laporanSiswa(s.student_id,semester);return '<button class=\"card\" data-open-report=\"'+s.student_id+'\">'+fotoSiswa(s.student_id)+'<b>'+esc(s.full_name)+'</b><span>'+badge('verification_status',r?r.status:'pending')+'</span></button>';}).join('')+'</div><div class=\"btns\"><button class=\"btn\" id=\"ajukan-semua\">Ajukan semua laporan untuk verifikasi</button></div></div><div id=\"report-editor\"></div>';
    root.querySelector('#ajukan-semua').onclick=function(){var missing=kids.filter(function(s){return !laporanSiswa(s.student_id,semester);});if(missing.length)return toast('Simpan laporan semua siswa terlebih dahulu: '+missing.map(function(s){return s.full_name;}).join(', '),true);kids.forEach(function(s){var r=laporanSiswa(s.student_id,semester);if(r.status==='draft'||r.status==='revision'){r.status='pending';r.submitted_at=waktuSekarang();}});save();toast('Semua laporan diajukan ke Kepala Sekolah.');render();};
    root.querySelectorAll('[data-open-report]').forEach(function(b){b.onclick=function(){var s=siswa(b.dataset.openReport),r=laporanSiswa(s.student_id,semester)||{student_id:s.student_id,semester:semester,status:'draft',scores:{},revision_note:'',snapshot:snapshotSiswa(s)};
      if(r.status==='approved'||r.status==='pending'){ $('#report-editor').innerHTML=renderReportCard(r,false)+'<p class="muted">'+(r.status==='approved'?'Laporan sudah disetujui dan dikunci.':'Laporan sedang menunggu verifikasi Kepala Sekolah.')+'</p>'; return; }
      $('#report-editor').innerHTML=renderReportCard(r,true);$('#report-editor').querySelector('[data-save-report]').onclick=function(){var vals={};ASPEK.forEach(function(a){var el=$('[name=\"score-'+a+'\"]');var v=Number(el.value);if(!Number.isInteger(v)||v<1||v>10)return toast('Nilai setiap indikator harus 1 sampai 10.',true);vals[a]=v;});r.scores=vals;r.snapshot=snapshotSiswa(s);r.status='draft';r.revision_note='';var idx=db.student_reports.findIndex(function(x){return x.student_id===s.student_id&&x.semester===semester;});if(idx>=0)db.student_reports[idx]=r;else{r.report_id=newId();r.teacher_id=U.user_id;r.class_name=kelasGuru();db.student_reports.push(r);}save();toast('Laporan siswa tersimpan.');render();};};
    });
  } else {
    var reports=db.student_reports.filter(function(r){return r.status==='approved'&&idBoleh().indexOf(r.student_id)>=0;});
    root.innerHTML=reports.length?reports.map(function(r){return '<button class=\"btn line no-print\" data-parent-report=\"'+r.report_id+'\">'+esc(siswa(r.student_id).full_name)+' · '+esc(r.semester)+'</button>';}).join('')+'<div id=\"parent-report-view\"></div>':'<div class=\"card empty\">Belum ada laporan semester yang disetujui.</div>';
    root.querySelectorAll('[data-parent-report]').forEach(function(b){b.onclick=function(){var r=cari(db.student_reports,'report_id',b.dataset.parentReport);$('#parent-report-view').innerHTML=renderReportCard(r,false)+'<div class=\"btns no-print\"><button class=\"btn\" id=\"download-report\">Download .pdf</button></div>';$('#download-report').onclick=function(){window.print();};};});
  }
}
if(U) render();
