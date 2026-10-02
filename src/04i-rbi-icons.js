// ---------------------------------------------------------------- Rupabumi pictograms
// Original topographic icons drawn for this plugin (24 × 24, currentColor) for
// lakes, rivers, contours, relief, vegetation, transport and public buildings.
const S_ = (d, w = 1.6) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const F_ = (d) => `<path d="${d}" fill="currentColor"/>`;
const RBI_ICONS = [
  // --- Perairan (hydrography)
  { group: "Perairan", id: "danau", name: "Danau", svg: F_("M4 11c0-4 4-6 8-6s8 1.5 8 5.5-3 7.5-8 7.5-8-3-8-7z") + `<path d="M7 11.5c1-.8 2-.8 3 0s2 .8 3 0 2-.8 3 0M8 14.5c1-.8 2-.8 3 0s2 .8 3 0" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>` },
  { group: "Perairan", id: "waduk", name: "Waduk / bendungan", svg: F_("M3 9c0-3 3-5 7-5h1v16h-1c-4 0-7-2-7-5z") + S_("M13 3v18M16 3v18", 2) + S_("M18 9c1.5 1 1.5 2 0 3s-1.5 2 0 3", 1.4) },
  { group: "Perairan", id: "sungai", name: "Sungai", svg: S_("M3 4c5 1 4 5 8 6s4 5 10 10", 2.4) },
  { group: "Perairan", id: "alur-sungai", name: "Alur / arah aliran sungai", svg: S_("M3 5c5 1 4 5 8 6s4 5 9 8", 1.8) + F_("M20.5 19.8l-5.2.6 1.8-1.9-.9-2.6z") },
  { group: "Perairan", id: "anak-sungai", name: "Anak sungai", svg: S_("M4 20c3-3 5-4 8-4s5-3 8-12", 2) + S_("M12 16c-2-3-2-6-6-10", 1.2) },
  { group: "Perairan", id: "mata-air", name: "Mata air", svg: `<circle cx="12" cy="15" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/>` + S_("M12 11V5M9 7l3-3 3 3", 1.6) },
  { group: "Perairan", id: "air-terjun", name: "Air terjun", svg: F_("M3 4h10v3H3z") + S_("M8 7v10M11 7v12M5 7v8", 1.5) + S_("M3 20c2-1 4-1 6 0s4 1 6 0 4-1 6 0", 1.5) },
  { group: "Perairan", id: "rawa", name: "Rawa", svg: S_("M3 19h18M6 19c0-3 0-5-1-7M6 19c0-3 1-5 2-6M6 19c0-2-1-4-2-5M17 19c0-3 0-5-1-7M17 19c0-3 1-5 2-6M17 19c0-2-1-4-2-5M10 15h4", 1.3) },
  { group: "Perairan", id: "pantai", name: "Garis pantai", svg: F_("M3 3h7c-1 4 2 6 1 10s-3 5-2 8H3z") + S_("M14 7c1.5-1 3-1 4.5 0M14 12c1.5-1 3-1 4.5 0M14 17c1.5-1 3-1 4.5 0", 1.3) },
  { group: "Perairan", id: "laut", name: "Laut", svg: S_("M3 8c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0M3 13c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0M3 18c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0", 1.4) },
  { group: "Perairan", id: "pelabuhan", name: "Pelabuhan", svg: S_("M12 7v14M8 10h8M5 15c0 3.5 3 6 7 6s7-2.5 7-6", 1.7) + `<circle cx="12" cy="5" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/>` },
  { group: "Perairan", id: "dermaga", name: "Dermaga", svg: F_("M3 10h18v3H3z") + S_("M6 13v6M12 13v6M18 13v6", 1.6) + S_("M3 20c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0", 1.2) },
  // --- Relief
  { group: "Relief", id: "kontur", name: "Garis kontur", svg: S_("M12 4c5 0 8 3 8 7s-3 9-8 9-8-4-8-8 3-8 8-8z", 1.1) + S_("M12 7c3.5 0 5.5 2 5.5 4.5S15 17 12 17s-5.5-2.5-5.5-5 2-5 5.5-5z", 1.1) + S_("M12 10c1.8 0 3 1 3 2s-1 2.5-3 2.5-3-1-3-2 1-2.5 3-2.5z", 1.1) },
  { group: "Relief", id: "kontur-indeks", name: "Kontur indeks", svg: S_("M3 18c4-2 6-6 9-6s5 4 9 6", 2.2) + S_("M3 13c4-2 6-6 9-6s5 4 9 6", 1) + S_("M3 22c4-2 6-4 9-4s5 2 9 4", 1) },
  { group: "Relief", id: "gunung", name: "Gunung", svg: F_("M2 20L9 7l3.5 5L15 9l7 11z") },
  { group: "Relief", id: "gunung-api", name: "Gunung api", svg: F_("M3 20l6-11h6l6 11z") + S_("M10 6c0-2 1-3 2-3M14 6c0-2-1-3-2-3M12 6V2", 1.4) },
  { group: "Relief", id: "puncak", name: "Titik tinggi / puncak", svg: F_("M12 5l7 13H5z") + `<circle cx="12" cy="14" r="1.6" fill="#fff"/>` },
  { group: "Relief", id: "bukit", name: "Bukit", svg: F_("M2 19c3-7 6-9 9-9s5 3 6 5c1-1 2-2 3-2s1.5 2 2 6z") },
  { group: "Relief", id: "gua", name: "Gua", svg: F_("M2 20c1-8 5-13 10-13s9 5 10 13z") + `<path d="M8 20c0-4 2-7 4-7s4 3 4 7z" fill="#fff"/>` },
  { group: "Relief", id: "lereng", name: "Lereng terjal", svg: S_("M3 18h18", 1.8) + S_("M5 18l1-5M9 18l1-6M13 18l1-6M17 18l1-5", 1.4) },
  // --- Vegetasi
  { group: "Vegetasi", id: "hutan", name: "Hutan", svg: F_("M7 3l4.5 7H9l3.5 5H8v4H6v-4H1.5L5 10H2.5z") + F_("M17 6l4 6h-2l3 4h-4v3h-2v-3h-4l3-4h-2z") },
  { group: "Vegetasi", id: "mangrove", name: "Mangrove", svg: `<circle cx="12" cy="7" r="4.5" fill="currentColor"/>` + S_("M12 11v5M12 16l-4 4M12 16l4 4M12 14l-6 6M12 14l6 6", 1.4) + S_("M3 21h18", 1.2) },
  { group: "Vegetasi", id: "perkebunan", name: "Perkebunan", svg: S_("M6 20v-8M18 20v-8M12 20v-8", 1.6) + F_("M6 12c-3 0-4-2-4-2s2-2 4-1c-1-2 0-4 0-4s2 1 2 4c2-1 4 1 4 1s-1 2-4 2z") + F_("M18 12c-3 0-4-2-4-2s2-2 4-1c-1-2 0-4 0-4s2 1 2 4c2-1 4 1 4 1s-1 2-4 2z") },
  { group: "Vegetasi", id: "sawah", name: "Sawah", svg: S_("M3 21h18M3 15h18", 1) + S_("M6 15V11M5 12l1-1 1 1M12 15v-4M11 12l1-1 1 1M18 15v-4M17 12l1-1 1 1M9 21v-4M8 18l1-1 1 1M15 21v-4M14 18l1-1 1 1", 1.3) },
  { group: "Vegetasi", id: "semak", name: "Semak belukar", svg: F_("M3 19c0-3 2-5 4-5 0-2 2-4 4-4s3 1 4 3c2 0 4 2 4 4v2z") },
  { group: "Vegetasi", id: "padang-rumput", name: "Padang rumput / savana", svg: S_("M4 19l1-5 1 5M10 19l1-6 1 6M16 19l1-5 1 5M3 20h18", 1.3) },
  // --- Transportasi
  { group: "Transportasi", id: "jalan", name: "Jalan", svg: S_("M8 3L5 21M16 3l3 18", 2) + S_("M12 4v3M12 10v4M12 17v3", 1.6) },
  { group: "Transportasi", id: "rel", name: "Jalan kereta api", svg: S_("M9 3v18M15 3v18", 1.4) + S_("M7 6h10M7 10h10M7 14h10M7 18h10", 1.6) },
  { group: "Transportasi", id: "jembatan", name: "Jembatan", svg: S_("M2 11h20M2 15h20", 1.8) + S_("M5 15c1 3 3 5 7 5s6-2 7-5", 1.3) + S_("M4 8l2 3M20 8l-2 3", 1.4) },
  { group: "Transportasi", id: "bandara", name: "Bandar udara", svg: F_("M21 15v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5.5z") },
  { group: "Transportasi", id: "terminal", name: "Terminal", svg: F_("M5 4h14a1 1 0 0 1 1 1v12H4V5a1 1 0 0 1 1-1z") + `<path d="M6 6h12v6H6z" fill="#fff"/>` + `<circle cx="7.5" cy="19" r="1.5" fill="currentColor"/><circle cx="16.5" cy="19" r="1.5" fill="currentColor"/>` },
  { group: "Transportasi", id: "stasiun", name: "Stasiun", svg: `<rect x="6" y="3" width="12" height="14" rx="3" fill="currentColor"/><path d="M8 6h8v5H8z" fill="#fff"/>` + S_("M8 21l2-4M16 21l-2-4", 1.6) },
  // --- Bangunan & fasilitas
  { group: "Bangunan & fasilitas", id: "permukiman", name: "Permukiman", svg: F_("M3 12l5-5 5 5v8H3z") + F_("M12 14l4.5-4.5L21 14v6h-9z") },
  { group: "Bangunan & fasilitas", id: "kantor", name: "Kantor pemerintahan", svg: F_("M12 3l9 5H3z") + F_("M3 20h18v1.5H3z") + S_("M6 10v8M10 10v8M14 10v8M18 10v8", 2) },
  { group: "Bangunan & fasilitas", id: "masjid", name: "Masjid", svg: F_("M12 4c3 2 5 4 5 7H7c0-3 2-5 5-7z") + F_("M6 12h12v8H6z") + F_("M3 9h2v11H3zM19 9h2v11h-2z") + `<path d="M10.5 20v-4a1.5 1.5 0 0 1 3 0v4z" fill="#fff"/>` },
  { group: "Bangunan & fasilitas", id: "gereja", name: "Gereja", svg: F_("M11 2h2v3h2v2h-2v2l5 4v8H6v-8l5-4V7H9V5h2z") + `<path d="M10.5 21v-4a1.5 1.5 0 0 1 3 0v4z" fill="#fff"/>` },
  { group: "Bangunan & fasilitas", id: "pura", name: "Pura / candi", svg: F_("M12 2l2 3h-4zM9 6h6l1 3H8zM7 10h10l1 3H6zM5 14h14v7H5z") + `<path d="M10.5 21v-4h3v4z" fill="#fff"/>` },
  { group: "Bangunan & fasilitas", id: "sekolah", name: "Sekolah", svg: F_("M12 3l10 5-10 5L2 8z") + S_("M6 10.5V16c2 2 10 2 12 0v-5.5M21 8v6", 1.6) },
  { group: "Bangunan & fasilitas", id: "rumah-sakit", name: "Rumah sakit / puskesmas", svg: `<rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor"/>` + F_("M10 6h4v4h4v4h-4v4h-4v-4H6v-4h4z").replace('fill="currentColor"', 'fill="#fff"') },
  { group: "Bangunan & fasilitas", id: "makam", name: "Makam", svg: F_("M8 21V9a4 4 0 0 1 8 0v12z") + S_("M12 9v6M10 11h4", 1.4).replace('stroke="currentColor"', 'stroke="#fff"') + S_("M4 21h16", 1.4) },
  { group: "Bangunan & fasilitas", id: "pasar", name: "Pasar", svg: F_("M3 9l2-5h14l2 5c0 1.5-1.2 2.5-2.5 2.5S16 10.5 16 9c0 1.5-1.8 2.5-4 2.5S8 10.5 8 9c0 1.5-1.2 2.5-2.5 2.5S3 10.5 3 9z") + F_("M5 13h14v8H5z") },
  { group: "Bangunan & fasilitas", id: "menara", name: "Menara telekomunikasi", svg: S_("M12 8l-5 13M12 8l5 13M9 15h6M8 18h8", 1.5) + `<circle cx="12" cy="6" r="2" fill="currentColor"/>` + S_("M7 3a7 7 0 0 0 0 6M17 3a7 7 0 0 1 0 6", 1.3) },
  { group: "Bangunan & fasilitas", id: "mercusuar", name: "Mercusuar", svg: F_("M10 6h4l1.5 14h-7z") + F_("M9.5 3h5v2h-5z") + S_("M4 4l3 1M20 4l-3 1M4 8l3-.5M20 8l-3-.5", 1.3) + S_("M6 21h12", 1.5) },
  { group: "Bangunan & fasilitas", id: "pos-jaga", name: "Pos jaga hutan", svg: F_("M5 10l7-6 7 6z") + F_("M7 10h10v3H7z") + S_("M8 13v8M16 13v8M8 17h8", 1.6) },
  // --- Batas & titik
  { group: "Batas & titik", id: "batas-negara", name: "Batas negara", svg: S_("M2 12h5M9 12h1M12 12h5M19 12h3", 2.2) },
  { group: "Batas & titik", id: "batas-provinsi", name: "Batas provinsi", svg: S_("M2 12h6M10 12h1M13 12h6M21 12h1", 1.6) },
  { group: "Batas & titik", id: "batas-kabupaten", name: "Batas kabupaten", svg: S_("M2 12h4M8 12h1M11 12h4M17 12h1M20 12h2", 1.2) },
  { group: "Batas & titik", id: "ibukota-provinsi", name: "Ibu kota provinsi", svg: `<rect x="5" y="5" width="14" height="14" fill="currentColor"/><rect x="9" y="9" width="6" height="6" fill="#fff"/>` },
  { group: "Batas & titik", id: "ibukota-kabupaten", name: "Ibu kota kabupaten", svg: `<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>` },
  { group: "Batas & titik", id: "titik-triangulasi", name: "Titik triangulasi", svg: S_("M12 4l8 15H4z", 1.6) + `<circle cx="12" cy="14" r="1.8" fill="currentColor"/>` },
  { group: "Batas & titik", id: "titik-sampel", name: "Titik sampel / plot", svg: S_("M12 2v5M12 17v5M2 12h5M17 12h5", 1.6) + `<circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6"/>` },
];
