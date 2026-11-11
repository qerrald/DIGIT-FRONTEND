/* index.html : Login (P-SPEC 1.1) */
'use strict';
(function () {
  var u = user(); if (u && u.status === 'active') { location.replace(u.must_change_password ? 'ubah-sandi.html' : HOME[u.role_id]); return; }
  var statusOrtu = function(){
    var id=$('#username').value.trim().toLowerCase(), u=db.users.find(function(x){return x.username.toLowerCase()===id||x.email.toLowerCase()===id;});
    $('#parent-role-wrap').hidden=!(u && u.role_id===3);
  };
  $('#username').addEventListener('input',statusOrtu); statusOrtu();
  var flash = sessionStorage.getItem('flash');
  if (flash) { var n = $('#login-ok'); n.textContent = flash; n.hidden = false; sessionStorage.removeItem('flash'); }
  $('#login-form').onsubmit = function (e) {
    e.preventDefault();
    var id = $('#username').value.trim().toLowerCase(), pw = $('#password').value;
    var found = db.users.find(function (x) { return x.username.toLowerCase() === id || x.email.toLowerCase() === id; });
    /* akun tidak ditemukan, sandi salah, atau akun belum aktif: pesan sama (login_status = "Failed") */
    if (!found || found.password_hash !== hash(pw) || found.status !== 'active') {
      var er = $('#login-error'); er.textContent = 'Login gagal. Periksa data Anda, atau hubungi admin jika akun belum disetujui.'; er.hidden = false; return;
    }
    if (found.role_id === 3) {
      var rel=$('#parent-relationship').value;
      if (!rel) { var er2=$('#login-error'); er2.textContent='Pilih status Anda sebagai Ayah, Ibu, atau Wali.'; er2.hidden=false; return; }
      sessionStorage.setItem('digit_login_relationship', rel);
    } else sessionStorage.removeItem('digit_login_relationship');
    sessionStorage.setItem(SESSION, found.user_id);
    location.href = found.must_change_password ? 'ubah-sandi.html' : HOME[found.role_id];
  };
  $$('[data-fill]').forEach(function (b) {
    b.onclick = function () { $('#username').value = b.dataset.fill; $('#password').value = b.dataset.fill + '123'; statusOrtu(); if(b.dataset.fill==='ortu') $('#parent-relationship').value='mother'; };
  });
})();
