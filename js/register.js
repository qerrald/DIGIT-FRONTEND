/* daftar.html : Registrasi akun (P-SPEC 1.4) */
'use strict';
(function () {
  var form = $('#register-form'), role = $('#role');
  var sync = function () { $$('[data-child]').forEach(function (el) { el.hidden = role.value !== '3'; }); $('#staff-note').hidden = role.value === '3'; };
  role.onchange = sync; sync();
  var err = function (m) { var b = $('#reg-error'); b.textContent = m; b.hidden = false; };
  form.onsubmit = function (e) {
    e.preventDefault();
    var v = {}; ['full_name', 'username', 'email', 'password', 'password2', 'nis', 'dob', 'relationship'].forEach(function (k) { v[k] = form.elements[k].value.trim(); });
    v.password = form.elements.password.value; v.password2 = form.elements.password2.value; v.role_id = +role.value;
    if (!v.full_name || !v.username || !v.email || !v.password) return err('Semua kolom wajib diisi.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) return err('Format email tidak valid.');
    if (v.password.length < 6) return err('Kata sandi minimal 6 karakter.');
    if (v.password !== v.password2) return err('Ulangi kata sandi tidak sama.');
    if (db.users.some(function (u) { return u.username.toLowerCase() === v.username.toLowerCase() || u.email.toLowerCase() === v.email.toLowerCase(); })) return err('Username atau email sudah terdaftar.');
    var status = 'pending', anak = null;
    if (v.role_id === 3) {                                             // Orang tua: verifikasi NIS + tanggal lahir anak
      if (!v.nis || !v.dob) return err('NIS dan tanggal lahir anak wajib diisi.');
      anak = db.students.find(function (s) { return s.student_number === v.nis && s.birth_date === v.dob && s.status === 'active'; });
      if (!anak) return err('NIS dan tanggal lahir tidak cocok dengan data siswa aktif.');
      status = 'active';
    }
    var u = { user_id: newId(), role_id: v.role_id, full_name: v.full_name, username: v.username, email: v.email, password_hash: hash(v.password), status: status, must_change_password: false };
    db.users.push(u);
    if (anak) db.student_guardians.push({ student_id: anak.student_id, user_id: u.user_id, relationship: v.relationship });
    save();
    sessionStorage.setItem('flash', status === 'active' ? 'Akun berhasil dibuat. Silakan masuk.' : 'Pendaftaran berhasil. Akun Anda akan aktif setelah disetujui admin.');
    location.href = 'index.html';
  };
})();
