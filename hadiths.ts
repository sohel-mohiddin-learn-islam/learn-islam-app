export type HadithTopic =
  | 'prayer'
  | 'manners'
  | 'family'
  | 'charity'
  | 'knowledge'
  | 'patience'
  | 'honesty'
  | 'gratitude'
  | 'repentance'
  | 'brotherhood';

export interface Hadith {
  id: string;
  topic: HadithTopic;
  source: string;
  arabic: string;
  english: string;
  romanHindi: string;
  romanTelugu: string;
  highlight: string;
}

export const topicLabels: Record<HadithTopic, { en: string; hi: string; te: string; color: string }> = {
  prayer:      { en: 'Prayer',      hi: 'Namaz',        te: 'Namaaz',       color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  manners:     { en: 'Manners',     hi: 'Akhlaaq',      te: 'Maaryaada',    color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300' },
  family:      { en: 'Family',      hi: 'Parivaar',     te: 'Kutumbam',     color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300' },
  charity:     { en: 'Charity',     hi: 'Sadaqah',      te: 'Danam',        color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  knowledge:   { en: 'Knowledge',   hi: 'Ilm',          te: 'Jnaanam',      color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' },
  patience:    { en: 'Patience',    hi: 'Sabr',         te: 'Oortimi',      color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300' },
  honesty:     { en: 'Honesty',     hi: 'Sidq',         te: 'Neeraajana',   color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' },
  gratitude:   { en: 'Gratitude',   hi: 'Shukr',        te: 'Krutagnaata',  color: 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300' },
  repentance:  { en: 'Repentance',  hi: 'Tawbah',       te: 'Pashchaattapam', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' },
  brotherhood: { en: 'Brotherhood', hi: 'Ukhuwwah',     te: 'Sahodaryam',   color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300' },
};

export const hadiths: Hadith[] = [
  // PRAYER
  {
    id: 'h001',
    topic: 'prayer',
    source: 'Sahih Bukhari 8',
    arabic: 'بُنِيَ الْإِسْلَامُ عَلَى خَمْسٍ',
    english: 'Islam has been built upon five things: the testimony that there is no god but Allah and that Muhammad is the Messenger of Allah, the establishment of the prayer, giving of zakah, the pilgrimage, and the fast of Ramadan.',
    romanHindi: 'Islam paanch cheezoon par qaayam hai: la ilaha illallah ki gawahi, namaz qaim karna, zakat dena, hajj karna, aur ramadan ka roza.',
    romanTelugu: 'Islam aidu visthuuvula pai nirminchababdindi: La ilaha illallah saakshyam, namaz cheyadam, zakat ichadam, hajj cheyadam, mariyu Ramadan roza.',
    highlight: 'Islam has been built upon five things',
  },
  {
    id: 'h002',
    topic: 'prayer',
    source: 'Sahih Muslim 223',
    arabic: 'الطَّهُورُ شَطْرُ الْإِيمَانِ',
    english: 'Purity is half of faith. Alhamdulillah fills the scale. SubhanAllah and Alhamdulillah fill what is between the heavens and the earth. Prayer is a light. Charity is a proof. Patience is illumination.',
    romanHindi: 'Tahaarat aadha iman hai. Alhamdulillah meezan ko bharta hai. Namaz noor hai. Sadaqah daleel hai. Sabr roshan hai.',
    romanTelugu: 'Shuchata ardha viswasam. Alhamdulillah taragati ni nirupistundi. Namaaz oka jyoti. Sadaqah oka niroopana. Sabr oka vellerturu.',
    highlight: 'Prayer is a light',
  },
  {
    id: 'h003',
    topic: 'prayer',
    source: 'Sahih Muslim 572',
    arabic: 'أَرَأَيْتُمْ لَوْ أَنَّ نَهْرًا بِبَابِ أَحَدِكُمْ',
    english: 'Tell me, if there was a river at the door of one of you in which he bathed five times a day, would any filth remain on him? They said: No filth would remain on him. He said: That is like the five prayers, with which Allah erases sins.',
    romanHindi: 'Paanch waqt ki namaz aise hai jaise koi har roz paanch baar nahaaye — Allah isse gunah saaf karta hai.',
    romanTelugu: 'Aidu paryaayaala namaaz adhe vidhangaa — neeru aidu saarlu mandatam vale — Allah danitho paapaaalu pogumaapistaaadu.',
    highlight: 'Allah erases sins',
  },
  {
    id: 'h004',
    topic: 'prayer',
    source: 'Sunan Abu Dawud 1268',
    arabic: 'رَكْعَتَا الْفَجْرِ خَيْرٌ مِنَ الدُّنْيَا وَمَا فِيهَا',
    english: 'The two rak\'ahs of Fajr (the voluntary prayer before the obligatory Fajr) are better than this world and all it contains.',
    romanHindi: 'Fajr ki do sunnat raka\'at duniya aur jo kuch us mein hai, sab se behtar hain.',
    romanTelugu: 'Fajr namaaz mundu cheyye rendu rakaatuulu – ivi yee duniya muttundinee, daaniloni samastanu kante uttamamainaivi.',
    highlight: 'better than this world and all it contains',
  },

  // MANNERS
  {
    id: 'h005',
    topic: 'manners',
    source: 'Sahih Bukhari 6029',
    arabic: 'إِنَّ مِنْ أَحَبِّكُمْ إِلَيَّ أَحْسَنَكُمْ أَخْلَاقًا',
    english: 'Indeed, the most beloved of you to me are those who have the best manners.',
    romanHindi: 'Tum mein mujhe sabse pyaare woh hain jinke akhlaaq sabse achche hain.',
    romanTelugu: 'Neevu naaku andaru kante priyuluugaa unnavaarlu mee madhya uttama maaryaada kalavaarlu.',
    highlight: 'the most beloved of you to me are those who have the best manners',
  },
  {
    id: 'h006',
    topic: 'manners',
    source: 'Sahih Muslim 2162',
    arabic: 'لَا تَحْقِرَنَّ مِنَ الْمَعْرُوفِ شَيْئًا',
    english: 'Do not belittle any act of kindness, even if it is that you meet your brother with a cheerful face.',
    romanHindi: 'Kisi bhi neki ko chhota mat samjho, chahe woh apne bhai se hanste chehre ke saath milna hi kyon na ho.',
    romanTelugu: 'Ela chinna maelaina mahimaani cheyyani mani takkuva kaadu. Mee sahodharudu ni manchumukha pattu kalusukovadam takkuva kaadu.',
    highlight: 'Do not belittle any act of kindness',
  },
  {
    id: 'h007',
    topic: 'manners',
    source: 'Sahih Bukhari 6018',
    arabic: 'وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ',
    english: 'Fear Allah wherever you are, and follow a bad deed with a good deed so that it will wipe it out, and deal with people with good character.',
    romanHindi: 'Jahan bhi ho Allah se daro, buri neki ke baad nek kaam karo aur logon ke saath achche akhlaaq se pesh aao.',
    romanTelugu: 'Meeru enduku unnaa Allah ni bhayapadu. Chetta pani tarvata manchidi cheyyi. Prajalaatho manci charitra tho vrthincu.',
    highlight: 'deal with people with good character',
  },
  {
    id: 'h008',
    topic: 'manners',
    source: 'Sahih Bukhari 6138',
    arabic: 'لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ',
    english: 'The strong man is not the one who can overpower others. The truly strong person is the one who controls himself when angry.',
    romanHindi: 'Takatwar woh nahi jo doosron ko giraye. Sachcha takatwar woh hai jo gusse mein khud par qaabu rakh sake.',
    romanTelugu: 'Shaktimaantudu tagrina vaarini geli cheyyagaliginavaaadu kaadu. Nijamaina shaktimaantudu kopamlo tanunu niyantrinchu konagivaaadu.',
    highlight: 'the one who controls himself when angry',
  },

  // FAMILY
  {
    id: 'h009',
    topic: 'family',
    source: 'Sahih Bukhari 5971',
    arabic: 'الْجَنَّةُ تَحْتَ أَقْدَامِ الْأُمَّهَاتِ',
    english: 'Paradise lies beneath the feet of mothers.',
    romanHindi: 'Jannat maon ke pairon ke neeche hai.',
    romanTelugu: 'Swargam tallula paadaala kinda undi.',
    highlight: 'Paradise lies beneath the feet of mothers',
  },
  {
    id: 'h010',
    topic: 'family',
    source: 'Sahih Bukhari 5978',
    arabic: 'مَنْ أَحَقُّ النَّاسِ بِحُسْنِ صَحَابَتِي',
    english: 'A man came to the Prophet and asked: O Messenger of Allah, who is most deserving of my good companionship? He said: Your mother. He asked: Then who? He said: Your mother. He asked: Then who? He said: Your mother. He asked: Then who? He said: Your father.',
    romanHindi: 'Ek aadmi ne pucha: Mera sabse zyada haq kaun rakhta hai? Aap ne farmaya: Teri maa. Phir? Teri maa. Phir? Teri maa. Phir? Tera baap.',
    romanTelugu: 'Oka vyakti adugaaadu: Yaaru neenu baagaa choodaalikogaa? Ayana: Mee talli. Malli? Mee talli. Malli? Mee talli. Malli? Mee nanna.',
    highlight: 'Your mother. Your mother. Your mother. Your father.',
  },
  {
    id: 'h011',
    topic: 'family',
    source: 'Sahih Bukhari 5186',
    arabic: 'خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ',
    english: 'The best of you are those who are best to their families, and I am the best of you to my family.',
    romanHindi: 'Tum mein sabse behtar woh hai jo apni family ke liye sabse behtar hai, aur main tumhare liye apni family ka sabse behtar shakhs hun.',
    romanTelugu: 'Mee madhya uttamudu tana kutumbaaniki uttamangaa undeevaadu. Naenu naa kutumbaniki mee andari kante maelu untaanu.',
    highlight: 'The best of you are those who are best to their families',
  },
  {
    id: 'h012',
    topic: 'family',
    source: 'Sunan Ibn Majah 3664',
    arabic: 'مَنْ كَانَ لَهُ ثَلَاثُ بَنَاتٍ',
    english: 'Whoever has three daughters and is patient with them, feeds them, gives them water, and clothes them from his wealth — they will be a shield for him from the Fire on the Day of Resurrection.',
    romanHindi: 'Jo paas teen betiyan hain aur woh sabr ke saath unhe khilaye, pilaaye aur kapde pahnaaye — woh qiyamat ke din dozakh ki dhaal banegi.',
    romanTelugu: 'Evarnainaayite mugguru kumaartelu unnaayi mariyu vaatini oortimitho penchaaruuu — veeru prabhudhaya dina agni nunchi addalagaa untaaru.',
    highlight: 'a shield for him from the Fire on the Day of Resurrection',
  },

  // CHARITY
  {
    id: 'h013',
    topic: 'charity',
    source: 'Sahih Bukhari 1410',
    arabic: 'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ',
    english: 'Charity does not decrease wealth. No one forgives another, except that Allah increases his honour. And no one humbles himself for the sake of Allah, except that Allah raises his status.',
    romanHindi: 'Sadaqah dene se maal kam nahi hota. Aur jo Allah ke liye jhukta hai, Allah use uthata hai.',
    romanTelugu: 'Danam cheyyatam valla sampadam taggadu. Allah ki jaati vigninchadam valla Allah meeru gurutimpu pedadtaadu.',
    highlight: 'Charity does not decrease wealth',
  },
  {
    id: 'h014',
    topic: 'charity',
    source: 'Sahih Bukhari 1382',
    arabic: 'اتَّقُوا النَّارَ وَلَوْ بِشِقِّ تَمْرَةٍ',
    english: 'Protect yourself from the Fire, even if it is with half a date. And if you cannot find even that, then with a kind word.',
    romanHindi: 'Aag se bachao, chahe khajoor ke aadhe tukre se hi ho. Aur agar woh bhi nahi, to ek achchi baat se.',
    romanTelugu: 'Agni nunchi maimini rakshinchukondi – akkapandu saraigaa ainaasari. Adi lekapoyina, manchimata tho ainaasari.',
    highlight: 'even if it is with half a date',
  },
  {
    id: 'h015',
    topic: 'charity',
    source: 'Sahih Muslim 1631',
    arabic: 'إِذَا مَاتَ الْإِنسَانُ انقَطَعَ عَنْهُ عَمَلُهُ إِلَّا مِنْ ثَلَاثَةٍ',
    english: 'When a person dies, his deeds come to an end except for three: a continuous charity (Sadaqah Jariyah), knowledge that is benefited from, and a righteous child who prays for him.',
    romanHindi: 'Jab insaan mar jata hai toh uske amal ruk jaate hain siwaay teen ke: sadaqah jaariyah, aisa ilm jis se faida uthaya jaaye, ya nek aulad jo dua karti rahe.',
    romanTelugu: 'Vyakti marinapudu vaatini amallu aagiporaiyyi, minammeeki muuDu teesi: nityamayana danam, upakaaramaina vidhya, mariyu tana kosam praarthinche dhaarmica santaanam.',
    highlight: 'a continuous charity, knowledge that is benefited from, and a righteous child',
  },

  // KNOWLEDGE
  {
    id: 'h016',
    topic: 'knowledge',
    source: 'Sunan Ibn Majah 224',
    arabic: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ',
    english: 'Seeking knowledge is an obligation upon every Muslim.',
    romanHindi: 'Ilm haasil karna har musalman par farz hai.',
    romanTelugu: 'Vidhyanu sapadadam prathi Muslimunaku farz.',
    highlight: 'Seeking knowledge is an obligation upon every Muslim',
  },
  {
    id: 'h017',
    topic: 'knowledge',
    source: 'Sahih Bukhari 71',
    arabic: 'مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ',
    english: 'When Allah wishes good for someone, He gives him understanding in religion.',
    romanHindi: 'Jab Allah kisi ke saath bhalai chahta hai, to use deen ki samajh ata karta hai.',
    romanTelugu: 'Allah evarnainaayite manchi cheyaalni anukoosaadi aayanaku dheeni lo arthamu ithadi.',
    highlight: 'He gives him understanding in religion',
  },
  {
    id: 'h018',
    topic: 'knowledge',
    source: 'Sahih Muslim 2699',
    arabic: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا',
    english: 'Whoever travels a path in search of knowledge, Allah will make easy for him a path to Paradise.',
    romanHindi: 'Jo ilm ki talaash mein koi raasta chalega, Allah us ke liye jannat ka raasta aasaan kar dega.',
    romanTelugu: 'Evaru jnaanam korakai oka margam prasaanistaaado, Allah vaatiki swargam maargam saulabhamainadi chesthaaadu.',
    highlight: 'Allah will make easy for him a path to Paradise',
  },
  {
    id: 'h019',
    topic: 'knowledge',
    source: 'Sunan Abu Dawud 3641',
    arabic: 'إِنَّ الْعُلَمَاءَ وَرَثَةُ الْأَنْبِيَاءِ',
    english: 'The scholars are the heirs of the Prophets. The Prophets did not leave behind gold or silver; they left behind knowledge. Whoever takes it has taken a great fortune.',
    romanHindi: 'Ulama anbiya ke waaris hain. Anbiya ne sona ya chaandi nahi chhoda, balki ilm chhoda. Jo ise le le, usne bada hissa le liya.',
    romanTelugu: 'Aalimulu Nabilaku varsulyudu. Nabilau bongaru ledu vadilicharu, vaaru vidhyanu vadichaaru. Evaru daanini tegedi vaadu oka gudduta bhagyanam tegedi vaadu.',
    highlight: 'The scholars are the heirs of the Prophets',
  },

  // PATIENCE
  {
    id: 'h020',
    topic: 'patience',
    source: 'Sahih Muslim 918',
    arabic: 'مَا أُصِيبَ مُسْلِمٌ مِنْ هَمٍّ وَلَا حَزَنٍ',
    english: 'No Muslim is afflicted with distress, grief, worry, sadness, harm, or sorrow — even the prick of a thorn — except that Allah will expiate some of his sins through it.',
    romanHindi: 'Koi bhi takleef, gham, pareshani ya dard jo musalmaan ko pahunche — yahan tak ke kaante ki chubhan — Allah isse gunah mitaata hai.',
    romanTelugu: 'Oka Muslimunaku vachina ela dukhamu, beduuru, visaadamu – muddu mulle gaatum kuda – Allah danitho kochina paapaalu pogumaapistaaadu.',
    highlight: 'Allah will expiate some of his sins through it',
  },
  {
    id: 'h021',
    topic: 'patience',
    source: 'Sahih Muslim 2999',
    arabic: 'عَجَبًا لِأَمْرِ الْمُؤْمِنِ',
    english: 'Wondrous is the affair of the believer! All of his affairs are good, and that is for no one except the believer. If good comes to him, he is thankful and that is good for him. If harm comes to him, he is patient and that is also good for him.',
    romanHindi: 'Momin ka kaam kya ajeeb hai! Agar usse khushi mile to shukar karta hai — yeh achi baat hai. Agar takleef aaye to sabr karta hai — yeh bhi achi baat hai.',
    romanTelugu: 'Mumin goppavaadu! Manci jarugutundi anugrahatho pratispondinchaaadu. Chetta jarugutundi oortiminaadu – okkekkati vaatiki vuramu.',
    highlight: 'All of his affairs are good',
  },
  {
    id: 'h022',
    topic: 'patience',
    source: 'Sahih Bukhari 5641',
    arabic: 'مَا يُصِيبُ الْمُسْلِمَ مِنْ نَصَبٍ وَلَا وَصَبٍ',
    english: 'No fatigue, illness, anxiety, sorrow, harm, or sadness afflicts a Muslim, even if it were the prick of a thorn, but Allah expiates some of his sins for that.',
    romanHindi: 'Muslim par jo bhi thakaan, bimari, gham, dard ya takleef aaye — Allah isse gunah maaf karta hai.',
    romanTelugu: 'Muslimunaki ela arogya samasya, beejaram, dukhamu, koshtu kaligitundi — Allah danitho vaariki kochina paapaalu pogumaapistaaadu.',
    highlight: 'Allah expiates some of his sins for that',
  },

  // HONESTY
  {
    id: 'h023',
    topic: 'honesty',
    source: 'Sahih Bukhari 6094',
    arabic: 'عَلَيْكُمْ بِالصِّدْقِ فَإِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ',
    english: 'You must be honest. Honesty leads to righteousness, and righteousness leads to Paradise. A man keeps being honest and striving to be honest until he is recorded with Allah as truthful.',
    romanHindi: 'Sachchi baat bolne ki aadat daalo. Sach bhalaai ki taraf le jaata hai aur bhalaai jannat ki taraf. Jo sacha rehta hai, Allah usse siddiq likh deta hai.',
    romanTelugu: 'Meeru satyavaantulugaa undaali. Satyamu dharmaaniki nidupaadatundi, dharmaamu swarganniki. Evaru sadaa satyamu choopukoontaro, vaariki Allah daggara "siddiq" ani likhinchabadiindi.',
    highlight: 'Honesty leads to righteousness, and righteousness leads to Paradise',
  },
  {
    id: 'h024',
    topic: 'honesty',
    source: 'Sahih Bukhari 2749',
    arabic: 'إِيَّاكُمْ وَالْكَذِبَ',
    english: 'Beware of lying. Lying leads to immorality, and immorality leads to the Fire. A man keeps lying and striving to lie until he is recorded with Allah as a liar.',
    romanHindi: 'Jhooth se bachte raho. Jhooth burai ki taraf le jaata hai, burai dozakh ki taraf. Jo jhootha rehta hai, Allah usse kazzab likh deta hai.',
    romanTelugu: 'Abbaddaala pattlu jaagrattagaa undi. Abbaddu cheddakiniki teestundi, cheddakalu narakaanniki. Evaru eppudu abbaddamaaduutaro, vaariki Allah daggara "kadhhabu" ani likhinchabadiindi.',
    highlight: 'Beware of lying',
  },

  // GRATITUDE
  {
    id: 'h025',
    topic: 'gratitude',
    source: 'Sahih Muslim 2963',
    arabic: 'انْظُرُوا إِلَى مَنْ أَسْفَلَ مِنْكُمْ',
    english: 'Look at those who are below you and do not look at those who are above you. For that is more worthy so that you do not belittle the blessings of Allah upon you.',
    romanHindi: 'Unse dekho jo tum se neeche hain, na unse jo upar hain. Aise tum Allah ki nematein ko chhota nahi samjhoge.',
    romanTelugu: 'Mee kante kinda unnavaatiki choodu, meeru paina unnavaatini kaadu. Idi Allah meekai ivvina anugrahaalanu takkuva cheyaakunda unnadi.',
    highlight: 'do not belittle the blessings of Allah upon you',
  },
  {
    id: 'h026',
    topic: 'gratitude',
    source: 'Sunan Abu Dawud 4811',
    arabic: 'لَا يَشْكُرُ اللَّهَ مَنْ لَا يَشْكُرُ النَّاسَ',
    english: 'He has not thanked Allah who has not thanked people.',
    romanHindi: 'Jisne logon ka shukriya nahi ada kiya usne Allah ka shukriya nahi ada kiya.',
    romanTelugu: 'Prajalaaku krtagnjata choopiinchani vaadu Allah ki krtaagnatanu choopiinchaledu.',
    highlight: 'He has not thanked Allah who has not thanked people',
  },
  {
    id: 'h027',
    topic: 'gratitude',
    source: 'Sahih Tirmidhi 3383',
    arabic: 'مَنْ لَمْ يَشْكُرِ الْقَلِيلَ لَمْ يَشْكُرِ الْكَثِيرَ',
    english: 'Whoever is not grateful for the small things will not be grateful for the large things.',
    romanHindi: 'Jo chhoti cheezon par shukar nahi karta, woh badi cheezon par bhi nahi karega.',
    romanTelugu: 'Evaru chinnavaatiki kritagnaatha choopi inchaaro vaaru peddavaatiki choopi inchaaru.',
    highlight: 'Whoever is not grateful for the small things will not be grateful for the large things',
  },

  // REPENTANCE
  {
    id: 'h028',
    topic: 'repentance',
    source: 'Sahih Muslim 2747',
    arabic: 'إِنَّ اللَّهَ يَبْسُطُ يَدَهُ بِاللَّيْلِ',
    english: 'Allah extends His hand at night so that the sinners of the day may repent. And He extends His hand during the day so that the sinners of the night may repent.',
    romanHindi: 'Allah raat ko apna haath phailata hai taaki din mein gunah karne wale taubah karein, aur din ko phailata hai taaki raat mein gunah karne wale taubah karein.',
    romanTelugu: 'Allah raatriki taana cheyyi pampistaaadu – pagal paapiulu pashchaattapadataamu. Pagal taana cheyyi pampistaaadu – raatriki paapiulu pashchaattapadataamu.',
    highlight: 'Allah extends His hand so that sinners may repent',
  },
  {
    id: 'h029',
    topic: 'repentance',
    source: 'Sahih Bukhari 6308',
    arabic: 'وَاللَّهِ إِنِّي لَأَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ فِي الْيَوْمِ أَكْثَرَ مِنْ سَبْعِينَ مَرَّةً',
    english: 'By Allah, I seek Allah\'s forgiveness and repent to Him more than seventy times a day.',
    romanHindi: 'Allah ki qasam! Main din mein sattar baar se zyada Allah se maafi maangta hoon aur taubah karta hoon.',
    romanTelugu: 'Wallahi! Nenu rojuuki seventy saarlakante ekkuva Allah nu kshaminchamanukuntaanu mariyu tauba chestunnaanu.',
    highlight: 'I seek Allah\'s forgiveness more than seventy times a day',
  },
  {
    id: 'h030',
    topic: 'repentance',
    source: 'Sahih Muslim 2758',
    arabic: 'لَوْ أَخْطَأْتُمْ حَتَّى تَبْلُغَ خَطَايَاكُمُ السَّمَاءَ',
    english: 'If you were to commit sins until your sins reached the sky, and then you repented, Allah would accept your repentance.',
    romanHindi: 'Agar tum itne gunah karo ke woh aasman tak pohunch jaayein, phir taubah karo — Allah teri taubah qubool karega.',
    romanTelugu: 'Meeru chesinaa paapaalu aakaasamulaku chaeruchunna aasinaa, malli taubha chesindi ante – Allah mee taubhanu qabul chestaaadu.',
    highlight: 'If you repented, Allah would accept your repentance',
  },

  // BROTHERHOOD
  {
    id: 'h031',
    topic: 'brotherhood',
    source: 'Sahih Bukhari 481',
    arabic: 'الْمُسْلِمُ أَخُو الْمُسْلِمِ',
    english: 'A Muslim is the brother of a Muslim. He does not oppress him, he does not abandon him, and he does not belittle him. It is sufficient for a person to be evil if he belittles his Muslim brother.',
    romanHindi: 'Musalman musalman ka bhai hai. Na usse zulm kare, na chhore, na chhota samjhe. Kisi ko bura hone ke liye yahi kaafi hai ke woh apne musalman bhai ko chhota samjhe.',
    romanTelugu: 'Muslim oka Muslimunaki sahodhurudu. Vaadu vaarini haniki cheyaledu, vaadu vaarini vadilichipedu, vaadu vaarini takkuva cheyaledu.',
    highlight: 'A Muslim is the brother of a Muslim',
  },
  {
    id: 'h032',
    topic: 'brotherhood',
    source: 'Sahih Bukhari 6011',
    arabic: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    english: 'None of you truly believes until he loves for his brother what he loves for himself.',
    romanHindi: 'Tum mein se koi sachcha momin nahi ho sakta jab tak woh apne bhai ke liye wahi na chahiye jo apne liye chahta hai.',
    romanTelugu: 'Meeru naijamaina viswasuli kaaleeru, meeru mee sahodharudi kosamu mee kosam korinattu korikunna varaku.',
    highlight: 'None of you truly believes until he loves for his brother what he loves for himself',
  },
  {
    id: 'h033',
    topic: 'brotherhood',
    source: 'Sahih Muslim 2564',
    arabic: 'لَا تَبَاغَضُوا وَلَا تَحَاسَدُوا',
    english: 'Do not hate one another, do not envy one another, do not turn away from one another, and be, O servants of Allah, brothers.',
    romanHindi: 'Aapas mein nafrat mat karo, hasad mat karo, ek doosre se munh mat modo, aur Allah ke bando bhai bano.',
    romanTelugu: 'Meeru okkaritoni okkaritu dveshinchakandi, hasad padakandi, vimukhulugaa kaakaandi. Allah ki bandulaaraa, sahodharulugaa undandi.',
    highlight: 'Do not hate one another, do not envy one another',
  },
];
