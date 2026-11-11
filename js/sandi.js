/* ubah-sandi.html : Ubah kata sandi (P-SPEC 1.5), termasuk wajib ganti sandi awal */
'use strict';
(function () {
  if (!U) return;
  var form = $('#sandi-form');
  if (U.must_change_password) { $('#forced-note').hidden = false; $('#batal').hidden = true; }
  var err = function (m) { var b = $('#sandi-error'); b.textContent = m; b.hidden = false; };
  form.onsubmit = function (e) {
    e.preventDefault();
    var cur = form.elements.current.value, nw = form.elements.baru.value, cf = form.elements.konfirmasi.value;
    if (U.password_hash !== hash(cur)) return err('Kata sandi saat ini salah.');
    if (nw.length < 6) return err('Kata sandi baru minimal 6 karakter.');
    if (nw === cur) return err('Kata sandi baru harus berbeda dari yang lama.');
    if (nw !== cf) return err('Ulangi kata sandi baru tidak sama.');
    U.password_hash = hash(nw); U.must_change_password = false; save();
    sessionStorage.setItem('flash', 'Kata sandi berhasil diubah.');
    location.href = HOME[U.role_id];
  };
})();
