/* kelola-akun.html : Kelola akun (P-SPEC 1.3) - khusus Admin */
'use strict';
function adminAktif() { return db.users.filter(function (u) { return u.role_id === 1 && u.status === 'active'; }); }
var roleAktif = '1';
function render() {
  var q = ($('#cari').value || '').toLowerCase();
  [1,2,3,4].forEach(function(id){var el=$('#count-role-'+id);if(el)el.textContent='('+db.users.filter(function(u){return u.role_id===id;}).length+')';});
  var urut = { pending: 0, active: 1, inactive: 2, rejected: 3 };
  var rows = db.users.filter(function (u) { return (roleAktif === 'all' || String(u.role_id) === roleAktif) && (u.full_name + u.username + u.email).toLowerCase().indexOf(q) >= 0; })
    .sort(function (a, b) { return urut[a.status] - urut[b.status] || a.full_name.localeCompare(b.full_name); });
  if (roleAktif === '3') {
    var groups = {};
    rows.forEach(function (u) {
      var gs = db.student_guardians.filter(function (g) { return g.user_id === u.user_id; });
      var kelas = gs.map(function (g) { return siswa(g.student_id).class_name; }).filter(function(k,i,a){return a.indexOf(k)===i;});
      (kelas.length ? kelas : ['Belum terhubung']).forEach(function (k) { (groups[k] = groups[k] || []).push(u); });
    });
    $('#grouped-accounts').innerHTML = Object.keys(groups).sort().map(function(k){ return '<section class="card"><h3>Orang Tua · ' + esc(k) + '</h3><p>' + groups[k].map(function(u){return '<span class="chip">'+esc(u.full_name)+'</span> <button class="btn ghost sm" data-aksi="ubah" data-id="'+u.user_id+'">Ubah</button> '+(u.status==='active'?'<button class="btn danger sm" data-aksi="inactive" data-id="'+u.user_id+'">Nonaktifkan</button>':'<button class="btn sm" data-aksi="active" data-id="'+u.user_id+'">Aktifkan</button>');}).join(' ') + '</p></section>'; }).join('') || '<div class="empty">Tidak ada akun orang tua.</div>';
    $('#account-table').hidden = true;
  } else { $('#grouped-accounts').innerHTML = ''; $('#account-table').hidden = false; }
  $('#rows').innerHTML = rows.map(function (u) {
    var aksi = '<button class="btn ghost sm" data-aksi="ubah" data-id="' + u.user_id + '">Ubah</button>';
    if (u.status === 'pending') aksi += '<button class="btn sm" data-aksi="active" data-id="' + u.user_id + '">Setujui</button><button class="btn danger sm" data-aksi="rejected" data-id="' + u.user_id + '">Tolak</button>';
    else if (u.status === 'active') aksi += '<button class="btn danger sm" data-aksi="inactive" data-id="' + u.user_id + '">Nonaktifkan</button>';
    else aksi += '<button class="btn sm" data-aksi="active" data-id="' + u.user_id + '">Aktifkan</button>';
    return '<tr><td><b>' + esc(u.full_name) + '</b><div class="muted">' + esc(u.email) + '</div></td><td>' + esc(u.username) + '</td><td>' + ROLE[u.role_id] + '</td><td>' + badge('account_status', u.status) + '</td><td><div class="actions">' + aksi + '</div></td></tr>';
  }).join('') || '<tr><td colspan="5"><div class="empty">Tidak ada akun.</div></td></tr>';
}
function penjagaAdminTerakhir(target, statusBaru, roleBaru) {
  var aktif = adminAktif();
  if (target.role_id === 1 && target.status === 'active' && aktif.length === 1 && (statusBaru !== 'active' || roleBaru !== 1)) return 'Admin aktif terakhir tidak boleh dinonaktifkan atau diubah perannya.';
  return '';
}
function formAkun(u) {
  var baru = !u.user_id, adm = baru ? {} : (db.admins.find(function (a) { return a.user_id === u.user_id; }) || {});
  var wali = baru ? [] : db.student_guardians.filter(function (g) { return g.user_id === u.user_id; });
  var nilai = Object.assign({}, u, { nip: adm.nip, position: adm.position, relationship: wali[0] ? wali[0].relationship : 'mother', children: wali.map(function (g) { return g.student_id; }), role_id: u.role_id || 2, status: u.status || 'active' });
  bukaForm(baru ? 'Tambah akun' : 'Ubah akun', [
    { name: 'full_name', label: 'Nama lengkap', required: true },
    { name: 'username', label: 'Username', required: true }, { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'password', label: 'Kata sandi', type: 'password', required: baru, hint: baru ? 'Minimal 6 karakter. Pengguna wajib menggantinya saat login pertama.' : 'Kosongkan jika tidak diubah.' },
    { name: 'role_id', label: 'Peran', type: 'select', options: [[1, 'Admin'], [2, 'Guru'], [3, 'Orang Tua'], [4, 'Kepala Sekolah']], required: true },
    { name: 'status', label: 'Status', type: 'select', options: Object.keys(L.account_status).map(function (k) { return [k, L.account_status[k]]; }), required: true },
    { name: 'nip', label: 'NIP', when: { field: 'role_id', values: ['1'] } }, { name: 'position', label: 'Jabatan', when: { field: 'role_id', values: ['1'] } },
    { name: 'relationship', label: 'Hubungan dengan anak', type: 'select', options: Object.keys(L.relationship).map(function (k) { return [k, L.relationship[k]]; }), when: { field: 'role_id', values: ['3'] } },
    { name: 'children', label: 'Anak yang terhubung', type: 'checks', options: db.students.map(function (s) { return [s.student_id, s.full_name + ' (' + s.class_name + ')']; }), when: { field: 'role_id', values: ['3'] } }
  ], nilai, function (d) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return 'Format email tidak valid.';
    if (d.password && d.password.length < 6) return 'Kata sandi minimal 6 karakter.';
    if (db.users.some(function (x) { return x.user_id !== u.user_id && (x.username.toLowerCase() === d.username.toLowerCase() || x.email.toLowerCase() === d.email.toLowerCase()); })) return 'Username atau email sudah terdaftar.';
    var role = +d.role_id;
    if (!baru) { var g = penjagaAdminTerakhir(u, d.status, role); if (g) return g; }
    var t = u;
    if (baru) { t = { user_id: newId(), must_change_password: true }; db.users.push(t); }
    else if (d.password) t.must_change_password = true;
    Object.assign(t, { role_id: role, full_name: d.full_name, username: d.username, email: d.email, status: d.status });
    if (d.password) t.password_hash = hash(d.password);
    db.admins = db.admins.filter(function (a) { return a.user_id !== t.user_id; });
    if (role === 1) db.admins.push({ admin_id: newId(), user_id: t.user_id, nip: d.nip || '-', position: d.position || 'Admin' });
    db.student_guardians = db.student_guardians.filter(function (g2) { return g2.user_id !== t.user_id; });
    if (role === 3) d.children.forEach(function (sid) { db.student_guardians.push({ student_id: sid, user_id: t.user_id, relationship: d.relationship }); });
    save(); toast(baru ? 'Akun ditambahkan.' : 'Akun diperbarui.');
  });
}
(function () {
  if (!U) return;
  $('#cari').oninput = render;
  $$('#role-tabs [data-role]').forEach(function(b){ b.onclick=function(){ roleAktif=b.dataset.role; $$('#role-tabs [data-role]').forEach(function(x){x.classList.toggle('active',x===b);}); render(); }; });
  $('#btn-tambah').onclick = function () { formAkun({}); };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-aksi]'); if (!b) return;
    var u = cari(db.users, 'user_id', b.dataset.id), a = b.dataset.aksi;
    if (a === 'ubah') return formAkun(u);
    var g = penjagaAdminTerakhir(u, a, u.role_id); if (g) return toast(g, true);
    var teks = { active: 'Aktifkan/setujui akun ', inactive: 'Nonaktifkan akun ', rejected: 'Tolak pendaftaran ' }[a];
    konfirmasi(teks + u.full_name + '?', function () { u.status = a; save(); toast('Status akun diperbarui.'); });
  });
  render();
})();
