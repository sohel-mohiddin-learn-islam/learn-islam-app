export interface SurahAyah {
  number: number;
  arabic: string;
  transliteration: string;
  english: string;
}

export interface Surah {
  number: number;
  nameAr: string;
  nameEn: string;
  revelation: 'Makki' | 'Madani';
  ayahs: number;
  theme: string;
  themeHi: string;
  themeTe: string;
  verses: SurahAyah[];
  virtualKeyLesson: string;
  keyLessonHi: string;
  keyLessonTe: string;
}

export const surahs: Surah[] = [
  {
    number: 1,
    nameAr: 'الْفَاتِحَة',
    nameEn: 'Al-Fatiha — The Opening',
    revelation: 'Makki',
    ayahs: 7,
    theme: 'The opening prayer — recited in every rakat of every prayer. The essence of the entire Quran in 7 verses.',
    themeHi: 'Har namaz ki har rakat mein padhi jaane wali dua — poore Quran ka khulasa 7 aayaton mein.',
    themeTe: 'Oka namaaz lo oka rakaat loni mottama chedinadi — Quran yokka saaransu 7 aayaatlo.',
    virtualKeyLesson: 'Al-Fatiha is a dialogue between the servant and Allah. When you say "You alone we worship," Allah says "This is between Me and My servant." It is the most repeated prayer in history.',
    keyLessonHi: 'Al-Fatiha bande aur Allah ke beech baat-chet hai. Jab "Iyyaka nabudu" kehte ho — Allah farmata hai: "Yeh Mere aur mere bande ke beech hai."',
    keyLessonTe: 'Al-Fatiha oka banda mariyu Allah madhya samvadam. "Iyyaka nabudu" antaamu — Allah: "Idi Naa mariyu Naa baanudu madhya undi" antaadu.',
    verses: [
      { number: 1, arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', transliteration: 'Bismillahir rahmanir raheem', english: 'In the name of Allah, the Most Gracious, the Most Merciful.' },
      { number: 2, arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', transliteration: 'Alhamdu lillahi rabbil alameen', english: 'All praise is due to Allah, Lord of all the worlds.' },
      { number: 3, arabic: 'الرَّحْمَٰنِ الرَّحِيمِ', transliteration: 'Ar-rahmanir raheem', english: 'The Most Gracious, the Most Merciful.' },
      { number: 4, arabic: 'مَالِكِ يَوْمِ الدِّينِ', transliteration: 'Maliki yawmid deen', english: 'Master of the Day of Judgment.' },
      { number: 5, arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', transliteration: 'Iyyaka nabudu wa iyyaka nastaeen', english: 'You alone we worship, and You alone we ask for help.' },
      { number: 6, arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', transliteration: 'Ihdinas siratal mustaqeem', english: 'Guide us to the straight path —' },
      { number: 7, arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', transliteration: 'Siratal ladheena anamta alayhim, ghayril maghdubi alayhim wa lad dalleen', english: 'The path of those upon whom You have bestowed favour, not of those who have evoked anger or of those who have gone astray.' },
    ],
  },
  {
    number: 112,
    nameAr: 'الْإِخْلَاص',
    nameEn: 'Al-Ikhlas — Purity of Faith',
    revelation: 'Makki',
    ayahs: 4,
    theme: 'The declaration of the absolute Oneness of Allah. The Prophet said reciting this once equals a third of the Quran.',
    themeHi: 'Allah ki mutlaq wahdaniyyat ka iqrar. Nabi (SAW) ne farmaya: ek baar padho — Quran ke ek teesre ke barabar.',
    themeTe: 'Allah yokka nirupamainaa Ekatvam yokka goshana. Nabi annaru: okasaari padithe — Quran yokka muduva bhagam samaanam.',
    virtualKeyLesson: 'This surah answers: Who is Allah? He is One, He is Eternal, He neither begets nor was begotten, and there is nothing comparable to Him. Four lines that define the Creator.',
    keyLessonHi: 'Yeh surah jawab deti hai: Allah kaun hai? Ahaad, Samad, Na kisi ka baap na kisi ka beta, koi ussi jaisa nahi. Chaar lainen — Khaliq ki pehchaan.',
    keyLessonTe: 'Ee suraa jawaabistundi: Allah evaru? Ahad, Samad, Aayana putrudu kaadu, aayana putrude kaadu, Aayanaaku samaanamu evaru ledu.',
    verses: [
      { number: 1, arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', transliteration: 'Qul huwallahu ahad', english: 'Say: He is Allah, the One.' },
      { number: 2, arabic: 'اللَّهُ الصَّمَدُ', transliteration: 'Allahus samad', english: 'Allah, the Eternal Refuge.' },
      { number: 3, arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', transliteration: 'Lam yalid wa lam yulad', english: 'He neither begets nor was He begotten.' },
      { number: 4, arabic: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', transliteration: 'Wa lam yakul lahu kufuwan ahad', english: 'Nor is there to Him any equivalent.' },
    ],
  },
  {
    number: 113,
    nameAr: 'الْفَلَق',
    nameEn: 'Al-Falaq — The Daybreak',
    revelation: 'Makki',
    ayahs: 5,
    theme: 'Seeking refuge in Allah from the evils of His creation. Recited for protection every morning and evening, and before sleep.',
    themeHi: 'Allah ki makhlooq ki burai se panah maangna. Subah shaam aur sone se pehle padhi jaati hai.',
    themeTe: 'Allah yokka srushti yokka cheddanundi sharagukuntunnam. Udayamu saayantram mariyu padukovadam mundu cheppinchabaditundi.',
    virtualKeyLesson: 'True protection comes only from Allah. When we say "I seek refuge in the Lord of Daybreak," we acknowledge that the same power that splits darkness with dawn can split any evil that threatens us.',
    keyLessonHi: 'Sachchi hifazat sirf Allah ki taraf se aati hai. "Falaaq ke Rabb ki panah" — wahi jo andheron ko todta hai, har burai ko bhi rok sakta hai.',
    keyLessonTe: 'Nijamaina suraksha sirf Allah daggara nundi. "Falaqu Prabhuvu lo sharagukuntunnam" — andhakarannu cheeduchu praabhaavamu ela cheddannu kuda aapagaladu.',
    verses: [
      { number: 1, arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', transliteration: 'Qul a\'udhu bi rabbil falaq', english: 'Say: I seek refuge in the Lord of Daybreak,' },
      { number: 2, arabic: 'مِن شَرِّ مَا خَلَقَ', transliteration: 'Min sharri ma khalaq', english: 'From the evil of what He has created,' },
      { number: 3, arabic: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', transliteration: 'Wa min sharri ghasiqin idha waqab', english: 'And from the evil of darkness when it settles,' },
      { number: 4, arabic: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ', transliteration: "Wa min sharrin naffathati fil uqad", english: 'And from the evil of those who blow on knots,' },
      { number: 5, arabic: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', transliteration: 'Wa min sharri hasidin idha hasad', english: 'And from the evil of an envier when he envies.' },
    ],
  },
  {
    number: 114,
    nameAr: 'النَّاس',
    nameEn: 'An-Nas — Mankind',
    revelation: 'Makki',
    ayahs: 6,
    theme: 'Seeking refuge from the whispering of Shaytan. Recited for protection. Together with Al-Falaq, they are called "Al-Mu\'awwidhatain" — the two surahs of seeking refuge.',
    themeHi: 'Shaytan ke waswase se Allah ki panah. Al-Falaq aur An-Nas milakar "Mu\'awwidhatain" kehlaati hain.',
    themeTe: 'Shaytaan yokka swathalanundi Allah lo sharagukuntunnam. Al-Falaq mariyu An-Nas kalisi "Mu\'awwidhatain" ga pilavabadiindi.',
    virtualKeyLesson: 'Shaytan\'s weapon is the whisper — the subtle, persistent suggestion that we cannot see but that shapes our thoughts. The cure is this surah: a declaration that we return to the Lord of all people, King of all people, and God of all people.',
    keyLessonHi: 'Shaytan ka hathiyar hai waswasa — woh aahistaa aahistaa dil mein bura dalta hai. Dawaa yeh surah hai — poori insaniyyat ke Rabb, Badshah aur Ilah ki panaah.',
    keyLessonTe: 'Shaytaan yokka aayudham ee swathalanamu — manasulo choppunu choopistundi. Dava ee suraa: sakala prajala Prabhuvu, Raju mariyu Devuniki thiragadam.',
    verses: [
      { number: 1, arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', transliteration: "Qul a'udhu birabbin nas", english: 'Say: I seek refuge in the Lord of Mankind,' },
      { number: 2, arabic: 'مَلِكِ النَّاسِ', transliteration: 'Malikin nas', english: 'The Sovereign of Mankind,' },
      { number: 3, arabic: 'إِلَٰهِ النَّاسِ', transliteration: 'Ilahin nas', english: 'The God of Mankind,' },
      { number: 4, arabic: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', transliteration: "Min sharril waswasil khannas", english: 'From the evil of the retreating whisperer —' },
      { number: 5, arabic: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', transliteration: "Alladhi yuwaswisu fi sudurin nas", english: 'Who whispers into the breasts of mankind —' },
      { number: 6, arabic: 'مِنَ الْجِنَّةِ وَالنَّاسِ', transliteration: 'Minal jinnati wan nas', english: 'From among the jinn and mankind.' },
    ],
  },
  {
    number: 103,
    nameAr: 'الْعَصْر',
    nameEn: 'Al-Asr — The Time',
    revelation: 'Makki',
    ayahs: 3,
    theme: 'Imam Shafi\'i said: "If people only reflected on this surah, it would suffice them." Every human is at loss — except those with four qualities.',
    themeHi: 'Imam Shafi\'i: "Agar log sirf is surah par ghour karte — yahi unhe kaafi hoti." Har insaan ghate mein hai — siwaaye 4 sifatton wale.',
    themeTe: 'Imam Shafi\'i annaru: "Prajalu ee suraa pai alochinchi — ee okkatitho chalunu." Oka manissi tappipoyinattundi — naalugu gunaalu gala vaaridii teesi.',
    virtualKeyLesson: 'Time is the most precious and irreplaceable commodity in existence. This surah teaches the formula for not being among the losers: faith, righteous deeds, truth, and patience.',
    keyLessonHi: 'Waqt sabse qeemti chiz hai — jo guze woh nahi aata. Yeh surah formula deti hai: imaan, nek amal, haq ki wasiyyat, sabr ki wasiyyat.',
    keyLessonTe: 'Samayamu adrutamainadi — potundi, thirigiradu. Ee suraa viphat kaanivaariki sutraamu: viswasam, manchi amallu, satya vasiyyatu, oortimi vasiyyatu.',
    verses: [
      { number: 1, arabic: 'وَالْعَصْرِ', transliteration: "Wal 'asr", english: 'By the time,' },
      { number: 2, arabic: 'إِنَّ الْإِنسَانَ لَفِي خُسْرٍ', transliteration: 'Innal insana lafi khusr', english: 'Indeed, mankind is in loss —' },
      { number: 3, arabic: 'إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ', transliteration: 'Illal ladhina amanu wa amilus salihati wa tawassaw bil haqqi wa tawassaw bis sabr', english: 'Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience.' },
    ],
  },
  {
    number: 108,
    nameAr: 'الْكَوْثَر',
    nameEn: 'Al-Kawthar — The Abundance',
    revelation: 'Makki',
    ayahs: 3,
    theme: 'The shortest surah in the Quran. Revealed to comfort the Prophet after enemies mocked him. Al-Kawthar is a river in Paradise.',
    themeHi: 'Quran ki sabse chhoti surah. Nabi (SAW) ko takleef dene waalon ke jawaab mein naazil hui. Al-Kawthar jannat ki nehr.',
    themeTe: 'Quran lo chettu chinna suraa. Nabi (SAW) ni tagginchinavaatiki jawaabulo naazil ayyi. Al-Kawthar swargamlo oka nadi.',
    virtualKeyLesson: 'To those who called the Prophet "Al-Abtar" (the cut-off, with no sons), Allah declared: YOU are the cut-off. The Prophet\'s legacy is the greatest in human history. True abundance is not in lineage — it is in faith and mission.',
    keyLessonHi: 'Jo Nabi (SAW) ko "Abtar" (beta nahi) kehte the — Allah ne farmaya: Abtar TUM ho. Nabi ka kaam qiyamat tak chalega.',
    keyLessonTe: 'Nabi (SAW) ni "Abtar" antuu — Allah: "Abtar MEERU." Nabi yokka vasaatam qiyamat varaku untuundi.',
    verses: [
      { number: 1, arabic: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ', transliteration: "Inna a'taynakal kawthar", english: 'Indeed, We have granted you Al-Kawthar.' },
      { number: 2, arabic: 'فَصَلِّ لِرَبِّكَ وَانْحَرْ', transliteration: "Fasalli lirabbika wanhar", english: 'So pray to your Lord and sacrifice.' },
      { number: 3, arabic: 'إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ', transliteration: "Inna shani'aka huwal abtar", english: 'Indeed, your enemy — it is he who is cut off.' },
    ],
  },
  {
    number: 110,
    nameAr: 'النَّصْر',
    nameEn: 'An-Nasr — Divine Support',
    revelation: 'Madani',
    ayahs: 3,
    theme: 'The last surah to be completely revealed — three months before the Prophet\'s death. A farewell from Allah, signaling the completion of the mission.',
    themeHi: 'Aakhri surah jo mukammal naazil hui — Nabi (SAW) ki wafaat se 3 mahine pehle. Allah ki taraf se ruhsati ka ishara.',
    themeTe: 'Chettu maasamu mottamugaa naazil ayina suraa — Nabi (SAW) wafaat ki 3 maasalu mundu. Allah nundi vidakolopu.',
    virtualKeyLesson: 'The mission was complete. The entire Arabian Peninsula had accepted Islam. Now the instruction: increase glorification of Allah and seek His forgiveness. The greater the achievement, the greater the humility before Allah.',
    keyLessonHi: 'Kaam mukammal hua. Poora Arabia Islam le aaya. Ab hukm: Allah ki tasbih karo, istighfar karo. Jitni badi kamyabi — utni zyada Allah ki badai karo.',
    keyLessonTe: 'Karyamu poortayindi. Poorti Arabia Islam vacchindi. Ippudu hukmu: Allah kee prasamsa cheyyumu, kshamaapanam korukonum. Goppa saphalyam vastiundi — Allah prati aadaaram pedadtundi.',
    verses: [
      { number: 1, arabic: 'إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ', transliteration: 'Idha jaa nasrullahi wal fath', english: 'When the victory of Allah has come and the conquest,' },
      { number: 2, arabic: 'وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا', transliteration: 'Wa ra aytan nasa yadkhuluna fi dinillahi afwaja', english: 'And you see the people entering into the religion of Allah in multitudes,' },
      { number: 3, arabic: 'فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ إِنَّهُ كَانَ تَوَّابًا', transliteration: 'Fasabbih bihamdi rabbika wastaghfirh, innahu kana tawwaba', english: 'Then exalt with praise of your Lord and ask forgiveness of Him. Indeed, He is ever Accepting of repentance.' },
    ],
  },
  {
    number: 109,
    nameAr: 'الْكَافِرُون',
    nameEn: 'Al-Kafirun — The Disbelievers',
    revelation: 'Makki',
    ayahs: 6,
    theme: 'The declaration of total separation from shirk. The Prophet said this surah is "a quarter of the Quran" and recommended reciting it before sleep. Called "the surah of disavowal."',
    themeHi: 'Shirk se mukammal bara\'at ka iqrar. Nabi ne farmaya yeh Quran ka ek chautha hai. Sone se pehle padhne ki sifaarish.',
    themeTe: 'Shirk nundi sampoorna verupaatu yokka goshana. Nabi annaru idi Quran yokka veerupu bhagam. Padukovadam mundu cheppinchandi.',
    virtualKeyLesson: 'There is no compromise on monotheism. The Prophet was offered wealth, power, and status to simply acknowledge the idols — and this surah was the answer. Clarity in faith means knowing what you will never compromise.',
    keyLessonHi: 'Tawheed par koi compromise nahi. Nabi ko daulat, izzat sab dene ki peshkash thi — sirf buto ko iqrar karo. Yeh surah jawab hai — imaan ki wazahat.',
    keyLessonTe: 'Tawheed pai ela rachcha leddu. Nabi ki daulat, ijjat ivi isthamu — but lu odhulukondi. Ee suraa aa sthiramainaa jawaab — nammakam lo vaaridii theeyatam.',
    verses: [
      { number: 1, arabic: 'قُلْ يَا أَيُّهَا الْكَافِرُونَ', transliteration: "Qul ya ayyuhal kafirun", english: 'Say: O you who disbelieve,' },
      { number: 2, arabic: 'لَا أَعْبُدُ مَا تَعْبُدُونَ', transliteration: "La a'budu ma ta'budun", english: 'I do not worship what you worship.' },
      { number: 3, arabic: 'وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ', transliteration: "Wa la antum abiduna ma a'bud", english: 'Nor are you worshippers of what I worship.' },
      { number: 4, arabic: 'وَلَا أَنَا عَابِدٌ مَّا عَبَدتُّمْ', transliteration: "Wa la ana abidun ma abadtum", english: 'Nor will I be a worshipper of what you worship.' },
      { number: 5, arabic: 'وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ', transliteration: "Wa la antum abiduna ma a'bud", english: 'Nor will you be worshippers of what I worship.' },
      { number: 6, arabic: 'لَكُمْ دِينُكُمْ وَلِيَ دِينِ', transliteration: 'Lakum dinukum wa liya din', english: 'For you is your religion, and for me is my religion.' },
    ],
  },
  {
    number: 255,
    nameAr: 'آيَة الْكُرْسِيّ',
    nameEn: 'Ayat ul-Kursi — The Verse of the Throne',
    revelation: 'Madani',
    ayahs: 1,
    theme: 'The greatest verse in the Quran — from Surah Al-Baqarah 2:255. The Prophet said whoever recites it after every obligatory prayer — nothing prevents him from entering Paradise except death.',
    themeHi: 'Quran ki sabse badi aayat — Al-Baqarah 2:255. Nabi: jo har farz namaz ke baad padhe — sirf maut jannat mein jaane se rokti hai.',
    themeTe: 'Quran lo goppamaina aayat — Al-Baqarah 2:255. Nabi: evaru oka namaaz tarvata ee dua antaaro — mariyu sivaayi ee swargamlo praveshinchadam atakadam ledu.',
    virtualKeyLesson: 'This single verse describes the complete sovereignty, knowledge, and power of Allah. It is the greatest protection, the greatest reminder, and the purest declaration of divine majesty in any scripture.',
    keyLessonHi: 'Yeh aayat Allah ki kamal badshahi, ilm aur qudrat bayan karti hai. Sabse badi hifazat, sabse bari yaad, aur ilahi azmat ka paakiza iqrar.',
    keyLessonTe: 'Ee aayat Allah yokka saampurna aadhinatvamu, jnaanamu mariyu shaktini varnistundi. Goppamaina suraksha, goppamaina yaad mariyu ela ilahee mahimanu vispadamu oka aanvayaaniki.',
    verses: [
      {
        number: 255,
        arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
        transliteration: "Allahu la ilaha illa huwal hayyul qayyum. La ta'khudhuhu sinatun wa la nawm. Lahu ma fis-samawati wa ma fil-ard. Man dhal-ladhi yashfa'u 'indahu illa bi-idhnih. Ya'lamu ma bayna aydihim wa ma khalfahum wa la yuhituna bishay'im min 'ilmihi illa bima sha'. Wasi'a kursiyyuhus-samawati wal-ard. Wa la ya'uduhu hifdhuhuma wa huwal 'aliyyul 'adhim.",
        english: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi (footstool) extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.",
      },
    ],
  },
];
