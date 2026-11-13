// Islamic avatars drawn as small SVGs. They are built in code, so they work offline and need no image files.
const svg = (bg: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#0b1f1a"/></linearGradient></defs><rect width="128" height="128" fill="url(#g)"/>${body}</svg>`;
const uri = (s: string) => `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;

const stars = `<g fill="#f5d77a" opacity=".8"><circle cx="18" cy="20" r="1.6"/><circle cx="108" cy="28" r="1.2"/><circle cx="100" cy="12" r="1.6"/><circle cx="24" cy="46" r="1"/></g>`;

type Opt = { skin: string; bg: string; cloth: string };
const eyes = `<circle cx="55" cy="66" r="2.6" fill="#2b1b12"/><circle cx="73" cy="66" r="2.6" fill="#2b1b12"/><path d="M57 77q7 6 14 0" stroke="#7a3b2e" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
const shoulders = (c: string) => `<path d="M16 128c2-26 20-38 48-38s46 12 48 38z" fill="${c}"/>`;
const head = (skin: string) => `<circle cx="64" cy="66" r="25" fill="${skin}"/>`;

// men / boys
const kufi = (o: Opt) => svg(o.bg, `${stars}${shoulders(o.cloth)}${head(o.skin)}<path d="M41 56a23 20 0 0 1 46 0z" fill="#fff"/><path d="M41 56h46" stroke="#d4a017" stroke-width="3"/><path d="M52 50l4-6 4 6 4-6 4 6 4-6" stroke="#d4a017" stroke-width="2" fill="none"/>${eyes}`);
const beard = (o: Opt) => svg(o.bg, `${stars}${shoulders(o.cloth)}${head(o.skin)}<path d="M40 70c0 22 10 32 24 32s24-10 24-32c-6 10-14 12-24 12s-18-2-24-12z" fill="#2b2220"/><path d="M41 56a23 20 0 0 1 46 0z" fill="#f4f1e8"/><path d="M41 56h46" stroke="#1f7a4d" stroke-width="3"/><circle cx="55" cy="66" r="2.6" fill="#fff"/><circle cx="73" cy="66" r="2.6" fill="#fff"/><path d="M58 80q6 3 12 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>`);
const turban = (o: Opt) => svg(o.bg, `${stars}${shoulders(o.cloth)}${head(o.skin)}<path d="M36 58c0-22 14-30 28-30s28 8 28 30c-10-8-18-10-28-10s-18 2-28 10z" fill="#f8f8f4"/><path d="M38 52c10-6 42-6 52 0" stroke="#d9d9d0" stroke-width="3" fill="none"/><path d="M40 70c0 20 10 30 24 30s24-10 24-30c-6 8-14 10-24 10s-18-2-24-10z" fill="#3a2d28"/><circle cx="55" cy="66" r="2.6" fill="#fff"/><circle cx="73" cy="66" r="2.6" fill="#fff"/>`);
// women / girls
const hijab = (o: Opt, scarf: string) => svg(o.bg, `${stars}<path d="M12 128c0-34 22-56 52-56s52 22 52 56z" fill="${scarf}"/><path d="M34 62c0-20 12-34 30-34s30 14 30 34c0 24-14 38-30 38S34 86 34 62z" fill="${scarf}"/><ellipse cx="64" cy="68" rx="20" ry="24" fill="${o.skin}"/>${eyes}<path d="M44 52c6-10 34-10 40 0" stroke="${scarf}" stroke-width="6" fill="none"/>`);
const niqab = (o: Opt) => svg(o.bg, `${stars}<path d="M12 128c0-34 22-56 52-56s52 22 52 56z" fill="#1c1c24"/><path d="M34 62c0-20 12-34 30-34s30 14 30 34c0 24-14 38-30 38S34 86 34 62z" fill="#1c1c24"/><rect x="44" y="58" width="40" height="14" rx="7" fill="${o.skin}"/><circle cx="55" cy="65" r="3" fill="#2b1b12"/><circle cx="73" cy="65" r="3" fill="#2b1b12"/>`);
// symbols
const mosque = (bg: string) => svg(bg, `${stars}<rect x="20" y="96" width="88" height="26" fill="#e9e2c8"/><path d="M34 96a30 30 0 0 1 60 0z" fill="#f6f0d8"/><rect x="63" y="46" width="2" height="12" fill="#d4a017"/><circle cx="64" cy="44" r="3" fill="#d4a017"/><rect x="14" y="56" width="10" height="66" fill="#e9e2c8"/><path d="M14 56l5-14 5 14z" fill="#d4a017"/><rect x="104" y="56" width="10" height="66" fill="#e9e2c8"/><path d="M104 56l5-14 5 14z" fill="#d4a017"/><path d="M56 122v-14a8 8 0 0 1 16 0v14z" fill="#1f7a4d"/>`);
const crescent = (bg: string) => svg(bg, `${stars}<path d="M80 30a36 36 0 1 0 0 68a28 28 0 1 1 0-68z" fill="#f5d77a"/><polygon points="92,52 96,62 107,62 98,69 101,80 92,73 83,80 86,69 77,62 88,62" fill="#f5d77a"/>`);
const kaaba = (bg: string) => svg(bg, `${stars}<path d="M24 52l40-12 40 12v58l-40 12-40-12z" fill="#15151a"/><path d="M24 52l40-12 40 12-40 12z" fill="#2a2a33"/><path d="M24 72h80v10H24z" fill="#d4a017"/><path d="M64 64v58" stroke="#3a3a44" stroke-width="2"/><rect x="72" y="88" width="14" height="24" rx="2" fill="#d4a017"/>`);
const lantern = (bg: string) => svg(bg, `${stars}<path d="M64 14v14" stroke="#d4a017" stroke-width="3"/><path d="M50 30h28l-3 8H53z" fill="#d4a017"/><path d="M52 38h24l8 18v38l-8 12H52l-8-12V56z" fill="#f5b13a"/><path d="M52 38h24l8 18v38l-8 12H52l-8-12V56z" fill="none" stroke="#7a4b00" stroke-width="2"/><path d="M64 44v62M50 70h28" stroke="#7a4b00" stroke-width="2"/><path d="M50 106h28l-4 10H54z" fill="#d4a017"/><circle cx="64" cy="74" r="12" fill="#fff3b8" opacity=".85"/>`);
const quran = (bg: string) => svg(bg, `${stars}<path d="M20 44l44 10 44-10v62l-44 10-44-10z" fill="#1f7a4d"/><path d="M64 54v62" stroke="#0e4a2e" stroke-width="3"/><path d="M26 50l38 9 38-9" stroke="#f5d77a" stroke-width="2" fill="none"/><circle cx="44" cy="82" r="10" fill="none" stroke="#f5d77a" stroke-width="2"/><circle cx="84" cy="82" r="10" fill="none" stroke="#f5d77a" stroke-width="2"/><path d="M44 74v16M36 82h16M84 74v16M76 82h16" stroke="#f5d77a" stroke-width="1.5"/>`);

const SK = ["#f1c9a5", "#d9a679", "#b9825a", "#8d5a3c"];
export const ISLAMIC_AVATARS: { name: string; url: string }[] = [
  { name: "Boy with kufi", url: uri(kufi({ skin: SK[0], bg: "#1f7a4d", cloth: "#2f5d9e" })) },
  { name: "Man with beard", url: uri(beard({ skin: SK[1], bg: "#0f766e", cloth: "#f4f1e8" })) },
  { name: "Man with turban", url: uri(turban({ skin: SK[2], bg: "#7c4a1d", cloth: "#1f7a4d" })) },
  { name: "Boy kufi 2", url: uri(kufi({ skin: SK[3], bg: "#4338ca", cloth: "#f4f1e8" })) },
  { name: "Girl hijab pink", url: uri(hijab({ skin: SK[0], bg: "#9d174d", cloth: "" }, "#ec7fa9")) },
  { name: "Woman hijab green", url: uri(hijab({ skin: SK[1], bg: "#14532d", cloth: "" }, "#2f9e63")) },
  { name: "Girl hijab blue", url: uri(hijab({ skin: SK[2], bg: "#1e3a8a", cloth: "" }, "#4f86e0")) },
  { name: "Woman niqab", url: uri(niqab({ skin: SK[1], bg: "#3b0764", cloth: "" })) },
  { name: "Mosque", url: uri(mosque("#0f766e")) },
  { name: "Crescent", url: uri(crescent("#1e3a8a")) },
  { name: "Kaaba", url: uri(kaaba("#78350f")) },
  { name: "Lantern", url: uri(lantern("#581c87")) },
  { name: "Quran", url: uri(quran("#0c4a6e")) },
];
