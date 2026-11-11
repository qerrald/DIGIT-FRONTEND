/* DIGIT - ui.js : penjaga akses (P-SPEC 1.2), menu per peran, modal form, konfirmasi, penampil gambar, verifikasi */
'use strict';
var U = null;   // pengguna yang sedang login (null jika dialihkan)

(function guard() {
  var u = user(), roles = (document.body.dataset.roles || '').split(',').filter(Boolean);
  if (!u || u.status !== 'active') { sessionStorage.removeItem(SESSION); location.replace('index.html'); return; }
  var halaman = document.body.dataset.page;
  if (u.must_change_password && halaman !== 'sandi') { location.replace('ubah-sandi.html'); return; }
  if (u.role_id === 2 && !u.teacher_class && halaman !== 'dashboard') { location.replace(HOME[2]); return; }
  if (roles.length && roles.indexOf(String(u.role_id)) < 0) { location.replace(HOME[u.role_id]); return; }
  U = u;
  if (u.must_change_password) document.body.classList.add('forced');
  $$('#menu a').forEach(function (a) {
    var r = (a.dataset.roles || '').split(',').filter(Boolean);
    if (r.length && r.indexOf(String(u.role_id)) < 0) a.classList.add('hide');
    if (a.hasAttribute('data-home')) a.href = HOME[u.role_id];
    if (a.dataset.page === halaman) a.classList.add('active');
  });
  var me = $('#me-name'); if (me) me.innerHTML = '<a href="ubah-sandi.html" style="color:inherit">' + esc(u.full_name) + '</a> · ' + ROLE[u.role_id];
  var lo = $('#logout'); if (lo) lo.onclick = function () { sessionStorage.removeItem(SESSION); sessionStorage.removeItem('digit_login_relationship'); location.href = 'index.html'; };
  var mb = $('#menu-btn'); if (mb) mb.onclick = function () { $('#sidebar').classList.toggle('open'); };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('#modal-root').innerHTML = ''; });
})();

function tutupModal() { $('#modal-root').innerHTML = ''; }
function segarkan() { if (typeof render === 'function') render(); }

/* Form modal. field: {name,label,type,options,blank,required,hint,when:{field,values:[...]}}
   type: text | date | email | password | textarea | select | file | checks */
function bukaForm(judul, fields, nilai, onSave) {
  var html = '<div class="modal-bg"><form class="modal" novalidate><h3>' + esc(judul) + '</h3><div id="f-err" class="alert" hidden></div>';
  fields.forEach(function (f) {
    var v = nilai[f.name] != null ? nilai[f.name] : '';
    var w = f.when ? ' data-when="' + f.when.field + '" data-values="' + f.when.values.join(',') + '"' : '';
    var hint = f.hint ? '<span class="hint">' + esc(f.hint) + '</span>' : '';
    if (f.type === 'checks') {
      html += '<fieldset class="checks"' + w + '><legend>' + esc(f.label) + '</legend>' + f.options.map(function (o) {
        return '<label><input type="checkbox" name="' + f.name + '" value="' + esc(o[0]) + '"' + ((v || []).indexOf(o[0]) >= 0 ? ' checked' : '') + '> ' + esc(o[1]) + '</label>'; }).join('') + hint + '</fieldset>';
      return;
    }
    html += '<label' + w + '>' + esc(f.label) + (f.required ? ' *' : '');
    if (f.type === 'select') {
      html += '<select name="' + f.name + '">' + (f.blank ? '<option value="">' + f.blank + '</option>' : '') +
        f.options.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
    } else if (f.type === 'textarea') {
      html += '<textarea name="' + f.name + '" rows="4">' + esc(v) + '</textarea>';
    } else if (f.type === 'file') {
      html += '<input type="file" name="' + f.name + '" accept="image/*">';
    } else {
      html += '<input name="' + f.name + '" type="' + (f.type || 'text') + '" value="' + (f.type === 'password' ? '' : esc(v)) + '" autocomplete="off">';
    }
    html += hint + '</label>';
  });
  html += '<div class="btns"><button type="button" class="btn ghost" data-batal>Batal</button><button class="btn">Simpan</button></div></form></div>';
  $('#modal-root').innerHTML = html;
  var form = $('#modal-root form');
  var sync = function () {
    $$('[data-when]', form).forEach(function (el) {
      var f = form.elements[el.dataset.when]; el.hidden = el.dataset.values.split(',').indexOf(f ? f.value : '') < 0;
    });
  };
  form.addEventListener('change', sync); sync();
  $('[data-batal]').onclick = tutupModal;
  $('.modal-bg').onclick = function (e) { if (e.target === this) tutupModal(); };
  var tampilError = function (msg) { var b = $('#f-err'); b.textContent = msg; b.hidden = false; };
  form.onsubmit = function (e) {
    e.preventDefault();
    var data = {}, tampil = function (f) { return !f.when || f.when.values.indexOf(form.elements[f.when.field].value) >= 0; };
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i], el = form.elements[f.name];
      if (!tampil(f)) { data[f.name] = f.type === 'checks' ? [] : ''; continue; }
      if (f.type === 'file') data[f.name] = el.files[0];
      else if (f.type === 'checks') data[f.name] = $$('input[name=' + f.name + ']:checked', form).map(function (c) { return +c.value; });
      else data[f.name] = f.type === 'password' ? el.value : el.value.trim();
      if (f.required && !data[f.name]) return tampilError(f.label + ' wajib diisi.');
    }
    Promise.resolve(onSave(data)).then(function (err) { if (err) tampilError(err); else { tutupModal(); segarkan(); } });
  };
}
function konfirmasi(teks, fn) {
  $('#modal-root').innerHTML = '<div class="modal-bg"><div class="modal"><h3>Konfirmasi</h3><p>' + esc(teks) + '</p><div class="btns"><button class="btn ghost" data-no>Batal</button><button class="btn" data-yes>Ya, lanjutkan</button></div></div></div>';
  $('[data-no]').onclick = tutupModal;
  $('[data-yes]').onclick = function () { tutupModal(); fn(); segarkan(); };
}
function bukaGambar(p) {
  var diskusi = (db.comments || []).filter(function(c){return c.portfolio_id===p.portfolio_id;}).sort(function(a,b){return String(a.created_at).localeCompare(String(b.created_at));});
  var isiKomentar = diskusi.filter(function(c){return !c.parent_id;}).map(function(c){
    var balasan=diskusi.filter(function(x){return x.parent_id===c.comment_id;}).map(function(x){return '<div class="comment-item" style="margin-left:22px"><b>'+esc(pengguna(x.user_id).full_name)+' · Guru</b><p>'+esc(x.body)+'</p></div>';}).join('');
    return '<div class="comment-item"><b>'+esc(pengguna(c.user_id).full_name)+'</b><p>'+esc(c.body)+'</p><small class="muted">'+esc(c.created_at||'')+'</small>'+(U.role_id===2?'<button class="btn ghost sm" data-reply-to="'+c.comment_id+'">Balas komentar</button>':'')+'</div>'+balasan;
  }).join('');
  var bolehKomentar = U.role_id === 3 && p.verification_status === 'approved';
  var bolehBalas = U.role_id === 2;
  $('#modal-root').innerHTML = '<div class="modal-bg"><div class="modal viewer"><img src="' + esc(p.file_path) + '" alt="' + esc(p.title) + '">' +
    '<h3>' + esc(p.title) + '</h3><p class="muted">' + esc(kegiatan(p.activity_id).activity_name) + ' · ' + esc(targetPorto(p)) + ' · ' + tgl(p.uploaded_at) + '</p>' +
    (p.description ? '<p>' + esc(p.description) + '</p>' : '') +
    '<section class="comment-box"><h3>Diskusi orang tua & guru</h3>' + (isiKomentar || '<p class="muted">Belum ada komentar.</p>') +
    (bolehKomentar ? '<textarea id="komentar-baru" rows="3" placeholder="Tulis komentar..."></textarea><button class="btn" data-kirim-komentar="'+p.portfolio_id+'">Kirim komentar</button>' : '') +
    (bolehBalas ? '<input type="hidden" id="reply-parent" value=""><textarea id="balasan-baru" rows="3" placeholder="Pilih komentar untuk dibalas atau tulis tanggapan..."></textarea><button class="btn" data-kirim-balasan="'+p.portfolio_id+'">Kirim balasan</button>' : '') +
    '</section><div class="btns"><button class="btn" data-tutup>Tutup</button></div></div></div>';
  $('[data-tutup]').onclick = tutupModal;
  var bg=$('.modal-bg'); if(bg) bg.onclick = function (e) { if (e.target === this) tutupModal(); };
  $$('[data-reply-to]').forEach(function(b){b.onclick=function(){var f=$('#reply-parent');if(f)f.value=b.dataset.replyTo;var ta=$('#balasan-baru');if(ta)ta.placeholder='Balas komentar yang dipilih...';};});
  var kc=$('[data-kirim-komentar]'); if(kc) kc.onclick=function(){var v=$('#komentar-baru').value.trim();if(!v)return toast('Komentar tidak boleh kosong.',true);db.comments.push({comment_id:newId(),portfolio_id:p.portfolio_id,user_id:U.user_id,body:v,created_at:waktuSekarang(),parent_id:null});save();bukaGambar(p);};
  var kb=$('[data-kirim-balasan]'); if(kb) kb.onclick=function(){var v=$('#balasan-baru').value.trim();if(!v)return toast('Balasan tidak boleh kosong.',true);db.comments.push({comment_id:newId(),portfolio_id:p.portfolio_id,user_id:U.user_id,body:v,created_at:waktuSekarang(),parent_id:Number($('#reply-parent').value)||null});save();bukaGambar(p);};
}
function targetPorto(p) { return p.student_id ? siswa(p.student_id).full_name : 'Kelas ' + p.class_name; }

/* Verifikasi Kepala Sekolah (P-SPEC 3.5 dan 5.5) */
function tombolVerif(tipe, r) {
  if (!U || U.role_id !== 4 || r.verification_status !== 'pending') return '';
  var id = tipe === 'dev' ? r.development_id : r.portfolio_id;
  return '<button class="btn sm" data-aksi="setuju" data-tipe="' + tipe + '" data-id="' + id + '">Setujui</button><button class="btn danger sm" data-aksi="revisi" data-tipe="' + tipe + '" data-id="' + id + '">Revisi</button>';
}
function aksiVerifikasi(aksi, id, tipe) {
  var r = tipe === 'dev' ? cari(db.development, 'development_id', id) : cari(db.portfolios, 'portfolio_id', id);
  if (r.verification_status !== 'pending') return toast('Data ini sudah diverifikasi.', true);
  if (aksi === 'setuju') { r.verification_status = 'approved'; r.verified_by = U.user_id; r.revision_note = ''; save(); toast('Disetujui.'); segarkan(); }
  else bukaForm('Minta revisi', [{ name: 'note', label: 'Catatan revisi', type: 'textarea', required: true }], {}, function (d) {
    r.verification_status = 'revision'; r.verified_by = U.user_id; r.revision_note = d.note; save(); toast('Revisi diminta.'); });
}
function opsiSiswa() { return siswaBoleh().filter(function (s) { return s.status === 'active'; }).map(function (s) { return [s.student_id, s.full_name + ' (' + s.class_name + ')']; }); }
function pasangFilter(key) {
  var sel = $('#filter-siswa'); if (!sel) return;
  var f = sessionStorage.getItem(key) || '';
  sel.innerHTML = '<option value="">Semua siswa</option>' + siswaBoleh().map(function (s) { return '<option value="' + s.student_id + '"' + (String(f) === String(s.student_id) ? ' selected' : '') + '>' + esc(s.full_name) + '</option>'; }).join('');
  sel.onchange = function () { sessionStorage.setItem(key, sel.value); segarkan(); };
}
