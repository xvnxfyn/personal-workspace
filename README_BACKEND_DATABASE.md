# Backend + Database Version

Project ini sudah diubah menjadi arsitektur:

- Front-end: React + Vite
- Back-end: Express API (`server.ts`)
- Database: SQLite melalui Prisma ORM (`prisma/schema.prisma`)

## Perubahan utama

1. `server/db.ts` tidak lagi menyimpan data ke `db_local.json`.
2. Semua data workspace sekarang masuk ke database SQLite `prisma/dev.db`.
3. API yang dipakai front-end tetap sama:
   - `/api/user`
   - `/api/pages`
   - `/api/pages/:id`
   - `/api/pages/:id/blocks`
   - `/api/tasks`
   - `/api/habits`
   - `/api/activities`
   - `/api/search`
4. Bug duplicate declaration pada `/api/search` sudah diperbaiki.

## Cara menjalankan

```bash
npm install
npm run dev
```

Script `npm run dev` akan menjalankan:

```bash
prisma generate
prisma db push
tsx server.ts
```

Lalu buka:

```text
http://localhost:3000
```

## Melihat isi database

```bash
npm run prisma:studio
```

## Catatan penting

- Saat pertama dijalankan, database otomatis diisi data awal agar halaman tidak kosong.
- Database default memakai SQLite supaya mudah untuk development lokal.
- Untuk production, database sebaiknya diganti ke PostgreSQL/MySQL dengan mengubah `provider` dan `DATABASE_URL` di Prisma.

## Functional Patch Notes
This version makes the formerly placeholder controls usable:
- Favorite Life OS and Second Brain now open their real workspace dashboards instead of empty database pages.
- Life OS buttons create real editable pages: Vision Board and Asset Ledger; Fitness opens Habit Tracker.
- Second Brain Quick Flash Inbox saves the idea as a new database-backed page.
- Habit Tracker weekly navigation works; monthly consistency is calculated from saved habit logs.
- Tasks support editable names, editable due dates, priority/status updates, filter cycling, and sort cycling.
- New Page and Trash use the database-backed page system.

Run:
```bash
npm install
npm run dev
```
Open:
```text
http://localhost:3000
```
