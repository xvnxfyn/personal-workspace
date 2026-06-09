# Personal Workspace - Version 2 Functional Patch

Patch ini dibuat agar aplikasi tidak lagi hanya menjadi tampilan front-end. Fitur inti sekarang tersambung ke Express API + Prisma + SQLite.

## Cara menjalankan

```powershell
cd "C:\Users\Kevin\Downloads\personal-workspace"
npm install
npm run dev
```

Buka:

```text
http://localhost:3000
```

## Fitur yang ditambahkan / diperbaiki

- New Page tersimpan ke database.
- Edit judul page tersimpan ke database.
- Edit block/page autosave ke database.
- Upload/change cover image di page.
- Add image block di page.
- Favorite page.
- Trash + restore + delete permanent.
- Global search: pages, tasks, asset portfolio, fitness records.
- Asset Portfolio CRUD + attachment file lokal tersimpan sebagai data URL.
- Fitness Matrix CRUD + monthly consistency stat.
- Notifications/reminder center sederhana.
- Settings aktif: profile picture upload, name/email, language, timezone, theme preference, role, export JSON.
- Online status: endpoint `/api/user/online` dipanggil otomatis setiap 30 detik.
- Database schema disiapkan untuk role dasar dan scaling ke PostgreSQL nanti.

## Catatan penting

1. File upload saat ini disimpan sebagai data URL di SQLite. Ini cocok untuk development/testing, bukan produksi skala besar.
2. Untuk produksi, media sebaiknya dipindah ke object storage seperti S3/Supabase Storage/Cloudinary.
3. Realtime WebSocket penuh belum dibuat sebagai kolaborasi Notion multi-user. Patch ini menyiapkan online heartbeat dasar dulu.
4. Role permission masih level data/settings, belum strict access-control per endpoint. Untuk multi-user sungguhan, perlu autentikasi + middleware permission.

## Upgrade database produksi

Untuk multi-user dan scaling, ganti Prisma provider dari SQLite ke PostgreSQL, ubah `DATABASE_URL`, lalu jalankan migration.
