export interface IslamicEvent {
  day: number;
  name: string;
  description: string;
  isHighlighted?: boolean;
}

export interface IslamicMonth {
  number: number;
  nameAr: string;
  nameEn: string;
  nameHi: string;
  nameTe: string;
  descriptionEn: string;
  descriptionHi: string;
  descriptionTe: string;
  events: IslamicEvent[];
  color: string;
}

export interface IslamicFact {
  titleEn: string;
  titleHi: string;
  titleTe: string;
  textEn: string;
  textHi: string;
  textTe: string;
}

export const islamicCalendarFacts: IslamicFact[] = [
  {
    titleEn: 'The Islamic Calendar',
    titleHi: 'Islami Calendar',
    titleTe: 'Islaamica Panchangam',
    textEn: 'The Islamic (Hijri) calendar is a lunar calendar of 12 months in a year of 354 or 355 days. It began with the migration (Hijra) of Prophet Muhammad (SAW) from Makkah to Madinah in 622 CE.',
    textHi: 'Islami Hijri calendar ek qamar calendar hai jisme 12 mahine aur 354/355 din hote hain. Yeh Nabi (SAW) ki Makkah se Madinah Hijra (622 CE) se shuru hua.',
    textTe: 'Islaamica Hijri panchangamu oka chaandra panchangamu — 12 maasaalu mariyu 354/355 rojulu. Idi Nabi (SAW) Makkah lo nundi Madinah ki Hijra (622 CE) tho mottamayyindi.',
  },
  {
    titleEn: 'Why Lunar?',
    titleHi: 'Qamar Calendar Kyun?',
    titleTe: 'Chandra Panchangamu Enduku?',
    textEn: 'The Quran commands: "They ask you about the new moons. Say: They are times appointed for people and for Hajj." (2:189). The moon is the divine timekeeping system — Ramadan, Eid, Hajj, and all Islamic occasions are tied to the lunar month.',
    textHi: 'Quran farmata hai: "Yeh log tum se naye chandramaa ke baare mein poochhte hain. Kaho: Yeh log ke liye aur hajj ke liye waqt mukarrar hain." Ramadan, Eid, Hajj sab moon se hain.',
    textTe: 'Quran antu: "Vaaru mee nundi navasam goorinchi adugutunnaru. Cheppu: Avi prajalu mariyu Hajj kosamu nirchayyinchina samayaalu." Ramadan, Eid, Hajj anni Chandra maasaala pai aadharitam.',
  },
];

export const islamicMonths: IslamicMonth[] = [
  {
    number: 1,
    nameAr: 'مُحَرَّم',
    nameEn: 'Muharram',
    nameHi: 'Muharram',
    nameTe: 'Muharram',
    descriptionEn: 'The first month of the Islamic year and one of the four sacred months in Islam. The word "Muharram" means "forbidden" — a time when fighting was traditionally forbidden. The 10th of Muharram is Ashura — a day of great significance.',
    descriptionHi: 'Islami saal ka pehla mahina aur char haraam mahinon mein se ek. "Muharram" ka matlab "haram" hai. 10 Muharram: Ashura — ek ahem din.',
    descriptionTe: 'Islaamica samvatsaram yokka mottama maasamu mariyu naalugu paavitramayna maasaalalo okati. 10 Muharram: Ashura — goppamaina roju.',
    color: 'from-rose-500 to-red-600',
    events: [
      { day: 1, name: 'Islamic New Year', description: 'The first day of the new Hijri year. A time for reflection and renewed intention toward Allah.', isHighlighted: true },
      { day: 10, name: 'Day of Ashura', description: 'The day Allah saved Musa (AS) and the Children of Israel from Pharaoh. The Prophet (SAW) fasted on this day and encouraged others. Fasting expiates sins of the past year.', isHighlighted: true },
    ],
  },
  {
    number: 2,
    nameAr: 'صَفَر',
    nameEn: 'Safar',
    nameHi: 'Safar',
    nameTe: 'Safar',
    descriptionEn: 'The second month of the Islamic year. The name may derive from the Arabic word meaning "empty" — as Arab tribes would leave their homes for war or travel during this month. Many pre-Islamic superstitions surrounded this month, which Islam has cleared away.',
    descriptionHi: 'Islami saal ka doosra mahina. Iske naam ka matlab "khaali" ho sakta hai. Jaahiliyya mein log is mahine bure shagoon samjhte the — jo Islam ne khatam kiya.',
    descriptionTe: 'Islaamica samvatsaram yokka rendu maasamu. Islamu mundu loni nammakaaluuu theesivesiindi.',
    color: 'from-orange-500 to-amber-600',
    events: [],
  },
  {
    number: 3,
    nameAr: 'رَبِيعُ الْأَوَّل',
    nameEn: 'Rabi al-Awwal',
    nameHi: 'Rabi ul-Awwal',
    nameTe: "Rabi ul-Awwal",
    descriptionEn: 'The third month — meaning "First Spring." This is the most blessed month of the Islamic year, for it is the month in which the Prophet Muhammad (SAW) was born (12th Rabi al-Awwal, 570 CE) and the month in which he passed away (12th Rabi al-Awwal, 11 AH). Muslims worldwide celebrate this month with gatherings of praise, remembrance, and gratitude.',
    descriptionHi: 'Teesra mahina — "Pehli Bahaar" maana. Yeh sabse afzal mahine mein se hai kyunki Nabi (SAW) is mahine mein paida aur wafaat paaye — 12 Rabi ul-Awwal. Ummah salawat aur zyar ke saath manati hai.',
    descriptionTe: 'Muu davamaasamu — "Mottama Vasantamu" artham. Idi Nabi (SAW) puтта maasamu mariyu wafaat maasamu — 12 Rabi ul-Awwal. Ummah ee maasamu lo salattu mariyu zikr chestundi.',
    color: 'from-green-500 to-emerald-600',
    events: [
      { day: 12, name: 'Mawlid un-Nabi (SAW)', description: 'The birth anniversary of the Prophet Muhammad (SAW) — a day when Muslims worldwide gather for praise, remembrance, and sending blessings upon the Prophet.', isHighlighted: true },
    ],
  },
  {
    number: 4,
    nameAr: 'رَبِيعُ الثَّانِي',
    nameEn: 'Rabi al-Thani',
    nameHi: 'Rabi ul-Akhir',
    nameTe: 'Rabi ul-Akhir',
    descriptionEn: 'The fourth month — meaning "Second Spring." A month of continued remembrance and gratitude, following the blessed month of Rabi al-Awwal.',
    descriptionHi: 'Chautha mahina — "Doosri Bahaar" maana.',
    descriptionTe: 'Naaluguvaa maasamu — "Rendu Vasantamu" artham.',
    color: 'from-teal-500 to-cyan-600',
    events: [],
  },
  {
    number: 5,
    nameAr: 'جُمَادَى الْأُولَى',
    nameEn: 'Jumada al-Awwal',
    nameHi: 'Jumadal Awwal',
    nameTe: 'Jumadal Awwal',
    descriptionEn: 'The fifth month of the Islamic year — "First Frozen." Originally named for the season when the ground would freeze. A month to reflect on the consistency of worship regardless of season or circumstance.',
    descriptionHi: 'Paanchwa mahina — "Pehla Jamna Hua." Har haal mein ibadat ki yaad.',
    descriptionTe: 'Aaiduvaa maasamu. Ela sthitulalounna nammakam pai drutapade ee maasamu.',
    color: 'from-sky-500 to-blue-600',
    events: [],
  },
  {
    number: 6,
    nameAr: 'جُمَادَى الثَّانِيَةُ',
    nameEn: 'Jumada al-Thani',
    nameHi: 'Jumadal Akhira',
    nameTe: 'Jumadal Akhira',
    descriptionEn: 'The sixth month — "Second Frozen." Khadijah bint Khuwaylid (RA), the first wife and supporter of the Prophet, passed away in this month. A time to remember her extraordinary sacrifice.',
    descriptionHi: 'Chhatha mahina — "Doosra Jamna Hua." Bibi Khadijah (RA) is mahine mein wafaat payin.',
    descriptionTe: 'Aaru vaa maasamu. Bibi Khadijah (RA) ee maasam lo wafaat ayyaaru.',
    color: 'from-indigo-500 to-violet-600',
    events: [],
  },
  {
    number: 7,
    nameAr: 'رَجَب',
    nameEn: 'Rajab',
    nameHi: 'Rajab',
    nameTe: 'Rajab',
    descriptionEn: 'The seventh month and one of the four sacred months. "Rajab" comes from a root meaning "to respect" — it was respected by Arabs even before Islam. The miraculous night journey of Isra and Miraj is believed to have occurred on the 27th of this month.',
    descriptionHi: 'Saatwa mahina — char haraam mahinon mein se ek. 27 Rajab: Shab-e-Miraj — Isra aur Miraj ki raat.',
    descriptionTe: 'Yeddhuvaa maasamu — naalugu paavitramayna maasaalalo okati. 27 Rajab: Isra mariyu Miraj yokka muktatara raatriki.',
    color: 'from-purple-500 to-fuchsia-600',
    events: [
      { day: 27, name: 'Isra and Miraj', description: 'The Night Journey — when Allah took the Prophet (SAW) from Makkah to Jerusalem and then through the seven heavens, receiving the five daily prayers.', isHighlighted: true },
    ],
  },
  {
    number: 8,
    nameAr: 'شَعْبَان',
    nameEn: 'Sha\'ban',
    nameHi: "Sha'ban",
    nameTe: "Sha'ban",
    descriptionEn: 'The eighth month — the month before Ramadan. The Prophet (SAW) would fast extensively in this month. He said: "This is a month that people neglect, between Rajab and Ramadan." It is a time to prepare the heart and body for Ramadan.',
    descriptionHi: "Aathwa mahina — Ramadan se pehle ka mahina. Nabi (SAW) is mahine mein zyada roza rakhte. Farmaya: 'Yeh woh mahina hai jise log ghafil karte hain, Rajab aur Ramadan ke beech.'",
    descriptionTe: "Enimidivaa maasamu — Ramadan mundu maasamu. Nabi (SAW) ee maasam lo zyada roza undevaaru. Annaru: 'Idi Rajab mariyu Ramadan madhya galasiyambadi maasamu.'",
    color: 'from-pink-500 to-rose-600',
    events: [
      { day: 15, name: "Laylatul Bara'ah (Night of Forgiveness)", description: 'The 15th night of Sha\'ban — many scholars hold it to be a night of special mercy and forgiveness. Spend it in worship and seeking forgiveness.', isHighlighted: true },
    ],
  },
  {
    number: 9,
    nameAr: 'رَمَضَان',
    nameEn: 'Ramadan',
    nameHi: 'Ramadan',
    nameTe: 'Ramadan',
    descriptionEn: 'The ninth and most blessed month of the Islamic year — the month of fasting, Quran, worship, and mercy. The Quran was first revealed in this month. The Prophet said: "When Ramadan enters, the gates of mercy are opened, the gates of hellfire are closed, and the devils are chained." Every night of the last ten nights could be Laylatul Qadr — better than a thousand months.',
    descriptionHi: 'Navwa aur sabse afzal mahina — roza, Quran, ibadat aur rahmat ka mahina. Quran isi mahine mein nazil hua. Nabi (SAW) ne farmaya: "Jab Ramadan aata hai — rahmat ke darwaze khulte hain, jahannam ke darwaze band hote hain, shayateen zanjeeron mein bandh hote hain." Aakhri 10 ratein — Laylatul Qadr ki talaash.',
    descriptionTe: 'Tommidivaa mariyu adrutamayna maasamu — roza, Quran, ibadat mariyu karunyam yokka maasamu. Quran ee masam lo mottam lo naazil ayyi. Nabi annaru: "Ramadan vacchenenattu — kaarunyam doorvaajaaalu tirustaayyi, narakam doorvaajaaalu moostaayyi, shaytaanulu saakhalalo badhintaaayyi." Chettu 10 raatriloanu Laylatul Qadr vesham.',
    color: 'from-yellow-500 to-amber-500',
    events: [
      { day: 1, name: 'Ramadan Begins', description: 'The start of the blessed month of fasting. Muslims worldwide begin their fast from Fajr to Maghrib.', isHighlighted: true },
      { day: 17, name: 'Battle of Badr', description: 'The first major victory of Islam — 313 Muslims defeated over 1000 Quraysh with divine assistance. (17 Ramadan 2 AH)' },
      { day: 21, name: 'Last 10 Nights Begin', description: 'The most blessed nights of the year. The Prophet would increase his worship tremendously in these nights, waking his family for prayer.', isHighlighted: true },
      { day: 27, name: 'Laylatul Qadr (likely)', description: 'The Night of Power — better than a thousand months. Jibreel and the angels descend. Every prayer, good deed, and Quran recitation is multiplied immensely.', isHighlighted: true },
    ],
  },
  {
    number: 10,
    nameAr: 'شَوَّال',
    nameEn: 'Shawwal',
    nameHi: 'Shawwal',
    nameTe: 'Shawwal',
    descriptionEn: 'The tenth month — the month of Eid al-Fitr, the celebration after Ramadan. The Prophet (SAW) encouraged fasting 6 days in Shawwal after Eid — "Whoever fasts Ramadan and then follows it with six days of Shawwal — it is as if he fasted the entire year."',
    descriptionHi: 'Daswa mahina — Eid ul-Fitr ka mahina. Eid ke baad Shawwal ke 6 roza rakhna sunnat hai — poore saal ke roza ka sawab.',
    descriptionTe: 'Padivaa maasamu — Eid ul-Fitr yokka maasamu. Eid tarvata Shawwal lo 6 rozalu undam prachalam — idi saampurna samvatsaram roza la punya samaanam.',
    color: 'from-emerald-500 to-green-600',
    events: [
      { day: 1, name: 'Eid al-Fitr', description: 'The Feast of Breaking Fast — one of the two great celebrations of Islam. A day of joy, prayer, giving Zakat al-Fitr, family, and gratitude to Allah.', isHighlighted: true },
    ],
  },
  {
    number: 11,
    nameAr: 'ذُو الْقَعْدَةِ',
    nameEn: "Dhul Qa'dah",
    nameHi: "Dhul Qa'dah",
    nameTe: "Dhul Qa'dah",
    descriptionEn: 'The eleventh month and one of the four sacred months. "Dhul Qa\'dah" means "The Month of Sitting" — traditionally a time of rest before the Hajj season. Pilgrims begin their journey toward Makkah.',
    descriptionHi: "Gyarahwa mahina — char haraam mahinon mein se ek. 'Baithne ka mahina' — Hajj se pehle araam ka waqt. Hujjaj Makkah ki taraf safar shuru karte hain.",
    descriptionTe: "Padakondu vaa maasamu — naalugu paavitramayna maasaalalo okati. Haajilu Makkah ki prayaanam mottamavutunnaayyi.",
    color: 'from-lime-500 to-green-500',
    events: [],
  },
  {
    number: 12,
    nameAr: 'ذُو الْحِجَّةِ',
    nameEn: 'Dhul Hijjah',
    nameHi: 'Dhul Hijjah',
    nameTe: 'Dhul Hijjah',
    descriptionEn: 'The twelfth and final month — the Month of Hajj. One of the four sacred months. The Prophet (SAW) said: "There are no days greater in the sight of Allah, or in which good deeds are more beloved to Him, than the first ten days of Dhul Hijjah." The 9th is the Day of Arafat — the most important day of Hajj, on which millions of pilgrims stand in prayer. The 10th is Eid al-Adha.',
    descriptionHi: 'Barahwa aur aakhri mahina — Hajj ka mahina. Nabi (SAW) ne farmaya: "Asmaan mein koi aaam bade nahi jitne Dhul Hijjah ke pehle 10 din." 9 Dhul Hijjah: Yawm-e-Arafat — hajj ka sabse ahem din. 10 Dhul Hijjah: Eid ul-Adha.',
    descriptionTe: 'Pannenduvaa mariyu chettu maasamu — Hajj yokka maasamu. Nabi (SAW) annaru: "Allah daggara Dhul Hijjah yokka mottama 10 rojulaa kante peddaviga manchi panikulu evariki istavunnaayyi." 9 Dhul Hijjah: Yawm-e-Arafat — Hajj yokka goppamaina roju. 10 Dhul Hijjah: Eid ul-Adha.',
    color: 'from-amber-500 to-yellow-600',
    events: [
      { day: 1, name: 'First Ten Days Begin', description: 'The Prophet said: "There are no days in which righteous deeds are more beloved to Allah than these ten days." Increase fasting, dhikr, charity, and prayer.', isHighlighted: true },
      { day: 8, name: 'Yaum al-Tarwiyah', description: 'Pilgrims travel from Makkah to Mina for the beginning of the Hajj rituals.' },
      { day: 9, name: 'Day of Arafat', description: 'The greatest day of the Islamic year. Pilgrims stand at the plain of Arafat in prayer. Non-pilgrims are encouraged to fast. Fasting expiates sins of the previous year and the coming year.', isHighlighted: true },
      { day: 10, name: 'Eid al-Adha', description: 'The Feast of Sacrifice — commemorating the supreme test of Ibrahim and Ismail (AS). Muslims sacrifice animals and distribute meat to family, neighbors, and the poor.', isHighlighted: true },
      { day: 18, name: 'Days of Tashreeq End', description: 'The last of the Days of Tashreeq (11th-13th) — pilgrims complete their Hajj rituals and return.' },
    ],
  },
];
