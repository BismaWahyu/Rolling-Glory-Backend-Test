# Case Study — Jawaban

> Konteks: saya di-*assign* sebagai Backend Developer di tengah project online booking PT Red Green Blue. Tim: PM, Tech Lead, 1 senior. Task: integrasi 3rd party library yang belum pernah saya pakai. Resource: repo + dokumentasi library. Timeline: 2 minggu.

---

## 1.a — Yang saya lakukan di awal assignment

Untuk situasi "join di tengah project", saya tidak akan langsung koding. Biasanya 2–3 hari pertama saya pakai untuk hal ini:

**1. Ngobrol dulu sama tim.**
Sync singkat dengan Tech Lead — minta gambaran arsitektur, kenapa library ini dipilih, bagian sistem mana yang akan tersentuh. Dengan PM — clarify scope, acceptance criteria, dan apa definisi "selesai". Perkenalan juga dengan senior team member supaya ada *go-to person* untuk pertanyaan harian, tidak selalu menginterupsi TL.

**2. Setup & eksplorasi repo.**
Clone, jalankan di lokal, pastikan test existing hijau. Baca dokumentasi internal, lihat modul yang relevan, pahami konvensi tim (lint rule, branching, PR template). Ini yang sering bikin developer baru tersandung kalau di-*skip*.

**3. Baca dokumentasi library + bikin POC kecil.**
Fokus ke bagian yang biasanya jadi masalah: authentication, rate limit, error handling, versi mana yang stabil. Saya bikin POC di sandbox terpisah untuk validasi *happy path* + 1–2 *edge case*, sebelum menyentuh repo utama. POC ini juga yang saya tunjukkan ke TL untuk validasi pendekatan.

**4. Breakdown task & align ke TL/PM.**
Susun rencana per hari, identifikasi risiko. Share ke TL dan PM, minta 15–30 menit untuk align. Lebih baik rencana direvisi di hari-2 daripada digeser di hari-10.

### Informasi kunci yang saya perlu tahu sebelum mulai

- **Scope & DoD** — yang termasuk dan tidak termasuk task saya, acceptance criteria-nya apa.
- **Credentials** — API key/sandbox sudah tersedia belum, siapa yang pegang. Kalau belum ada, ini *blocker* pertama yang saya eskalasi di hari-1.
- **Technical boundary** — modul mana saja yang akan saya sentuh, ada *interface* existing yang bisa dipakai ulang?
- **Standar tim** — coding style, testing strategy (mocking 3rd party kayak apa), PR review policy.
- **Dependency** — ada tim lain (FE misalnya) yang menunggu endpoint saya?
- **Non-functional** — SLA, rate limit, cara handle timeout/retry, format logging.

### Asumsi

- Saya punya akses repo + channel komunikasi sejak hari-1.
- Sandbox credential tersedia (kalau tidak, langsung eskalasi).
- 2 minggu = 10 hari kerja. Target: hari 1–3 untuk 4 langkah di atas, hari 4–8 implementasi, hari 9 buffer/testing, hari 10 PR review & merge.

---

## 1.b — Cara informasikan kalau tidak yakin selesai deadline

Dua prinsip yang saya pegang:

- **Kasih tahu sedini mungkin**, jangan tunggu H-1. Begitu sadar ada risiko (idealnya minimal H-3), langsung *heads-up*.
- **Bawa konteks + opsi solusi**, bukan cuma masalah. Pesan "saya nggak yakin selesai" memaksa TL/PM menggali sendiri — waktu mereka terbuang.

### Urutan siapa yang dikontak

**1. Tech Lead dulu (DM chat, santai).**
Masalahnya teknis, jadi TL yang paling tepat. Saya minta waktu 30 menit untuk diskusi — seringkali blocker cair setelah pair session. Contoh pesannya:

> "Halo Mas/Mba [TL], boleh minta waktu 30 menit hari ini atau besok pagi? Lagi ngerjain integrasi [library X] dan nemu beberapa blocker yang kayaknya berdampak ke modul [nama modul]. Mau konsultasi pendekatannya sebelum lanjut biar nggak salah arah. Progress sekarang ~[X]%, deadline H-[Y]."

**2. Senior team member (paralel).**
Sambil menunggu slot TL, saya tanya senior untuk *second opinion* dan konteks historis modul yang perlu dimodifikasi. Senior biasanya tahu hal yang tidak ada di dokumentasi.

**3. PM — setelah diskusi teknis sudah ada gambaran.**
Baru setelah saya dan TL sepakat risikonya real, saya inform PM secara **formal** (email / pesan channel project, sesuai konvensi tim). Isinya:

> **Subject:** [Travel Booking] Risk update — integrasi [library X]
>
> Halo Pak/Bu [PM],
>
> Update progress integrasi [library X] yang target-nya [tanggal]:
>
> **Progress:** [apa yang sudah selesai, apa yang lagi dikerjain]
>
> **Blocker:** ternyata modul [nama] perlu dimodifikasi juga karena [alasan singkat]. Ini belum masuk estimasi awal. Sudah didiskusikan dengan Mas/Mba [TL], kami sama-sama melihat modifikasi ini memang diperlukan.
>
> **Opsi:**
> 1. Perpanjangan deadline [X hari] — delivery lengkap sesuai scope. *(rekomendasi saya)*
> 2. Split dua fase — Fase 1 (deadline awal): happy-path saja dengan workaround temporer. Fase 2 (+[X] hari): modifikasi modul + cleanup.
> 3. Scope cut — [fitur Y] ditunda, biar modifikasi modul lebih minimal.
>
> Saya butuh keputusan terkait opsi di atas, dan kalau opsi 2/3, alignment dengan stakeholder [Travel] kalau perlu. Bisa sync kapan pun.
>
> Thanks,
> [Nama]

**4. Stakeholder eksternal (perusahaan Travel) — bukan saya.**
Itu wilayah PM. Saya cukup siapkan bahan/summary teknis yang clean untuk PM bawa ke client.

### Hal yang saya hindari

- Nunggu sampai hari-H baru bilang "maaf belum selesai".
- *Blast* ke semua stakeholder sekaligus, *bypass* TL.
- Diskusi keputusan penting di DM pribadi — nggak ada *paper trail*. Keputusan wajib masuk ke channel / email.
- Berhenti kerja sambil menunggu jawaban. Tetap lanjut yang bisa dikerjakan paralel.

### Asumsi

- Tim pakai kombinasi chat (Slack/Teams) untuk diskusi harian + email untuk keputusan formal. Kalau full-chat, email diganti pesan formal di channel project.
- PM yang jadi jembatan ke client — saya tidak kontak Travel langsung tanpa sepengetahuan PM.
- Kalau TL sedang tidak available, saya eskalasi ke senior dulu sambil *tag* TL di pesan, bukan menunggu pasif.
