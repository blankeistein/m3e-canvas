# PRD: Visual Compose Builder (Fork of m3e-canvas)

## 1. Executive Summary

**Problem Statement**
Prototyping UI cepat biasanya berhenti di tahap "gambar/mockup" (seperti m3e-canvas) dan tidak menghasilkan kode yang bisa langsung dipakai di project React atau Kotlin/Jetpack Compose. Menyusun layout nested (Row/Column/Box/Lazy list) secara manual di kode juga lebih lambat dibanding menyusunnya secara visual.

**Proposed Solution**
Fork dari [m3e-canvas](https://github.com/lnkiai/m3e-canvas) menjadi visual builder berbasis **tree komponen** (mirip Jetpack Compose: Row, Column, Box, Lazy*, komponen custom) yang disusun di canvas, lalu di-export menjadi kode **React (JSX)** dan **Kotlin (Jetpack Compose)** dari satu struktur data yang sama.

**Success Criteria**
- Bisa menyusun tree nested minimal 3 level (Column > Row > Box > Text) via drag-and-drop.
- Export ke React dan Kotlin menghasilkan kode valid (bisa langsung ditempel & dijalankan) untuk semua komponen dasar.
- Bisa membuat komponen custom (gabungan beberapa node) dan dipakai ulang di tree lain.
- Struktur data (schema) tunggal dipakai oleh kedua compiler, tidak ada logic khusus platform yang bocor ke schema.

## 2. User Experience & Functionality

**User Persona**
- Andika sendiri — developer web & Android, dipakai untuk prototyping cepat sebelum coding manual, tidak untuk dijual/dipakai klien di tahap ini.

**User Stories**
- Sebagai developer, saya ingin menyusun layout dengan drag-and-drop Row/Column/Box/LazyColumn agar tidak perlu menulis struktur nested secara manual.
- Sebagai developer, saya ingin mengatur properti tiap komponen (padding, size, background, arrangement, dll) lewat panel inspector agar konsisten dengan konsep modifier Compose.
- Sebagai developer, saya ingin membuat komponen custom dari gabungan node lalu memakainya berulang di berbagai screen.
- Sebagai developer, saya ingin mengekspor tree menjadi kode React (JSX) untuk dipakai di project web.
- Sebagai developer, saya ingin mengekspor tree yang sama menjadi kode Kotlin (Jetpack Compose) untuk dipakai di project Android.

**Acceptance Criteria**
- Setiap node punya representasi visual di canvas dan representasi di tree/layer panel (mirip `Layers.tsx` di m3e-canvas).
- Mengubah properti di inspector langsung memperbarui preview dan tree data.
- Export React dan export Kotlin tersedia sebagai dua tombol/panel terpisah (seperti `PromptPanel.tsx` yang sudah ada, tapi menghasilkan kode, bukan teks prompt).
- Komponen custom disimpan sebagai definisi terpisah dan bisa di-drop ke tree lain sebagai referensi (bukan duplikasi data).

**Non-Goals (untuk versi ini)**
- Tidak ada backend/server — tetap client-side, seperti proyek asal.
- Tidak ada real-time collaboration / multi-user.
- Tidak menghasilkan kode Flutter, SwiftUI, atau framework lain — hanya React & Kotlin Compose.
- Tidak membangun state management/logic (event handler kompleks) — fokus ke struktur visual/layout saja dulu.
- **Tidak mengubah UI/tampilan editor yang sudah ada** (lihat batasan scope di 3.4a) — panel, styling, dan layout aplikasi m3e-canvas tetap dipertahankan.

## 3. Technical Specifications

### 3.1 Arsitektur Data (Schema)

Model data pakai **plain JSON tree** untuk state & penyimpanan (localStorage, sama seperti proyek asal), dipisah dari **class hierarchy** yang menangani logic generate kode.

```json
{
  "id": "node_1",
  "type": "Column",
  "modifiers": {
    "padding": { "all": 16 },
    "width": "fillMax",
    "height": "wrap",
    "background": { "color": "#FFFFFF" },
    "clip": { "radius": 12 },
    "weight": null,
    "clickable": null
  },
  "props": {
    "verticalArrangement": "center",
    "horizontalAlignment": "start",
    "gap": 8
  },
  "children": ["node_2", "node_3"]
}
```

Prinsip schema:
- `modifiers`: shape sama di semua tipe node (padding, width, height, background, clip, weight, clickable, dll) — sumber untuk `Modifier.xxx()` chain di Kotlin dan `style`/`className` di React.
- `props`: field spesifik per tipe komponen, didaftarkan di satu **component registry** sebagai single source of truth (dipakai untuk validasi, generate form Inspector otomatis, dan referensi compiler).
- Value harus **platform-neutral** (contoh: `"width": "fillMax"`, bukan `"match_parent"` atau `"100%"`) — compiler yang menerjemahkan ke istilah masing-masing platform.

### 3.2 Arsitektur Kode Generator (Class Hierarchy)

```ts
abstract class ComposeNode {
  id: string;
  modifiers: ModifierProps;
  children: ComposeNode[] = [];

  abstract toKotlin(indent: number): string;
  abstract toReact(indent: number): string;

  protected modifierToKotlin(): string { /* shared logic */ }
  protected modifierToReactStyle(): Record<string, any> { /* shared logic */ }
}
```

- Tiap komponen (Row, Column, Box, Text, Button, LazyColumn, dll) jadi subclass yang mengimplementasikan `toKotlin()` dan `toReact()` sendiri.
- Logic modifier yang shared (padding, size, background, dll) ditaruh di base class agar tidak duplikasi.
- State editor tetap berupa JSON (`NodeData`); saat generate kode, JSON di-**hydrate** jadi instance class lewat fungsi `hydrate(data)` yang memilih subclass berdasarkan `type`.
- Alur: `Canvas State (JSON)` → `hydrate()` → `ComposeNode tree` → `.toKotlin(0)` / `.toReact(0)` → string kode.

### 3.3 Komponen Dasar (Fase Awal)

Referensi resmi: [Compose modifiers list](https://developer.android.com/develop/ui/compose/modifiers-list), [androidx.compose.foundation.layout](https://developer.android.com/reference/kotlin/androidx/compose/foundation/layout/package-summary), [androidx.compose.material3](https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary).

| Komponen | Kategori | Catatan |
|---|---|---|
| Column | Layout | vertical arrangement, horizontal alignment, gap |
| Row | Layout | horizontal arrangement, vertical alignment, gap |
| Box | Layout | contentAlignment, stacking children |
| LazyColumn / LazyRow | Layout (scroll) | contentPadding, reverseLayout |
| Text | Basic | text, size, weight, color, maxLines |
| Button | Basic | label, enabled, variant |
| TextField | Basic | value, placeholder, label |
| Image | Basic | source, contentScale |
| Spacer | Basic | size |
| Divider | Basic | thickness, color |
| Custom | Reusable | referensi ke definisi component tersimpan |

### 3.4 Batasan Scope: UI Tidak Berubah

Perubahan pada proyek ini **hanya menyentuh data model & logic internal**, bukan tampilan editor. Prinsip pemisahan:

| Tetap dipertahankan (UI/komponen) | Berubah (data & logic) |
|---|---|
| `Layers.tsx` — tampilan daftar layer | Data yang ditampilkan: dari list flat → tree hierarki |
| `Inspector.tsx` — form edit properti | Field yang muncul: mengikuti component registry baru (props per tipe) |
| `PartsPalette.tsx` — panel drag komponen | Daftar entri: tambah Column/Row/Box/Lazy*, tapi cara drag & tampilan tombol sama |
| `Preview.tsx` — area canvas/preview | Cara render dihitung: dari koordinat x/y → dari struktur flex tree |
| Styling, layout aplikasi, tema editor | Tidak berubah sama sekali |

Yang benar-benar baru (di luar file/panel yang sudah ada):
- Logic internal canvas yang mengonversi aksi drag-drop menjadi struktur data tree (bukan `{x, y}`).
- Dua file compiler baru: `ReactExporter.tsx`, `KotlinComposeExporter.tsx` — beroperasi di belakang layar, dipicu tombol export (bisa reuse pola tombol yang sudah ada di `PromptPanel.tsx`).

**Prinsip kerja**: setiap perubahan didekati sebagai "ganti data yang mengalir ke komponen UI yang sudah ada", bukan "bangun ulang komponen UI". Kalau suatu perubahan mengharuskan menulis ulang tampilan panel yang sudah ada, itu sinyal untuk mundur dan cari pendekatan lain yang tidak menyentuh UI.

### 3.5 Perubahan dari m3e-canvas (basis fork)

Struktur asal yang dipakai ulang:
- `components/Layers.tsx` → jadi tree/layer panel (sudah cocok konsepnya).
- `components/Inspector.tsx` → jadi panel edit `props`/`modifiers` per node.
- `components/PartsPalette.tsx` → sumber drag komponen baru ke canvas.
- `components/PromptPanel.tsx` → jadi basis untuk `ReactExporter` dan `KotlinExporter`.

Perubahan struktural utama:
- Model posisi node dari **absolute (x/y)** → **tree parent-child dengan constraint layout** (arah, gap, padding, alignment). Ini perubahan terbesar karena mengubah cara canvas & drag-drop bekerja.
- Tambah dua compiler baru di sebelah `PromptPanel.tsx`: `ReactExporter.tsx` dan `KotlinComposeExporter.tsx`.
- Tambah sistem definisi component custom (simpan sub-tree terpisah + referensi by ID).

### 3.6 Integration Points
- Tidak ada API eksternal wajib (client-side only, sesuai proyek asal), **kecuali** fitur AI-assisted generation (3.7) yang butuh koneksi ke LLM API.
- Penyimpanan tetap di localStorage browser.
- AI helper existing (`AiPanel.tsx`) menjadi basis untuk fitur AI-assisted tree generation (lihat 3.7), dikembangkan lebih jauh dari sekadar generate teks prompt.

### 3.7 AI-Assisted Tree Generation

**Tujuan**: User menulis deskripsi teks (mis. "buat card profil dengan foto, nama, dan tombol follow"), AI menghasilkan JSON tree yang langsung valid sesuai schema, bukan sekadar teks/prompt untuk AI lain.

**Prinsip utama**: AI tidak boleh generate JSON bebas — harus dipaksa mengikuti schema & component registry yang sama dengan yang dipakai compiler (3.1–3.2), sehingga jalur render/export sama persis baik untuk node manual maupun node hasil AI. Fitur ini juga tunduk pada batasan scope UI di 3.4 — AI mengisi data yang mengalir ke panel yang sudah ada, tidak menambah panel/tampilan baru.

**Alur end-to-end**:
```
User prompt teks
   ↓
AI (dengan tool schema + component registry di system prompt)
   ↓
JSON tree (tool_use result)
   ↓
validateNode() — tolak/retry kalau invalid, dengan pesan error spesifik
   ↓
hydrate() → jadi ComposeNode instance
   ↓
Masuk ke canvas state (bisa diedit manual seperti node lain)
   ↓
.toKotlin() / .toReact() saat export (tidak ada compiler khusus AI)
```

**Komponen teknis**:
1. **Structured output via tool use** — pakai tool/function calling (bukan minta AI "tulis JSON di teks") dengan `input_schema` yang mencerminkan shape `NodeData` (type, modifiers, props, children) agar hasil selalu valid secara struktur.
2. **Component registry sebagai konteks AI** — kirim daftar komponen valid beserta props & modifier keys yang diterima (sama seperti `COMPONENT_SCHEMA` di 3.1) ke system prompt, supaya AI tidak mengarang field yang tidak ada di schema.
3. **Validasi runtime sebelum masuk state** — tetap validasi hasil AI dengan Zod/Ajv terhadap registry meski sudah pakai tool schema, karena tool schema tidak menjamin isi (nama komponen typo, prop tidak dikenal, dsb).
4. **Self-correction loop** — kalau validasi gagal, kirim balik pesan error spesifik ke AI untuk retry (mis. "Component `Colum` tidak dikenal, mungkin maksud `Column`?"), bukan langsung gagal ke user.

**Acceptance Criteria**:
- User bisa mengetik deskripsi teks dan mendapat tree yang langsung muncul di canvas (bukan hanya teks).
- Hasil AI selalu tervalidasi terhadap component registry sebelum masuk ke canvas state — tidak ada node dengan `type` atau props yang tidak dikenal.
- Node hasil AI bisa diedit manual di Inspector/canvas sama seperti node yang dibuat lewat drag-drop.
- Node hasil AI bisa langsung diekspor ke React maupun Kotlin tanpa compiler tambahan.

**Non-Goals (fase ini)**:
- AI tidak menghasilkan logic/event handler, hanya struktur visual/layout.
- Tidak ada streaming edit granular (AI mengubah node spesifik di tengah tree) — fase awal hanya generate tree baru dari prompt.

## 4. Risks & Roadmap

### Risiko Teknis
- **Perubahan model posisi (absolute → tree)** adalah risiko terbesar — berpotensi mengubah banyak bagian canvas/drag-drop yang sudah ada di m3e-canvas.
- **Konsistensi schema**: kalau `modifiers`/`props` tidak dijaga ketat lewat registry, dua compiler (React & Kotlin) bisa divergen seiring waktu.
- **Mapping value platform-neutral → platform-specific** perlu didaftarkan lengkap sejak awal (misal semua opsi `Arrangement`, `Alignment`) agar tidak ada kasus tak terduga saat compile.

### Roadmap Bertahap
1. **MVP**: Schema JSON + base class `ComposeNode` + 4 komponen (Column, Row, Box, Text) + export React & Kotlin dasar (tanpa drag-drop UI, bisa manual dulu via test data).
2. **v1.1**: Integrasi ke canvas hasil fork (drag-drop tree-based, Inspector generate form dari registry, Layers panel).
3. **v1.2**: Tambah komponen sisanya (LazyColumn/LazyRow, Button, TextField, Image, Spacer, Divider).
4. **v2.0**: Custom component (buat, simpan, reuse, expand saat export).
5. **v2.1**: AI-assisted tree generation (tool schema + registry-aware prompt + validasi + self-correction loop).

## 5. Referensi
- Repo basis fork: https://github.com/lnkiai/m3e-canvas
- Compose Modifiers List: https://developer.android.com/develop/ui/compose/modifiers-list
- Compose Foundation Layout API: https://developer.android.com/reference/kotlin/androidx/compose/foundation/layout/package-summary
- Compose Material3 API: https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary
- Referensi tidak resmi (lebih enak dibaca): https://composables.com/docs