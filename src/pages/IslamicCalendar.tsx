import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GoldenText } from '@/components/GoldenText';
import { IslamicDivider } from '@/components/IslamicDivider';
import { islamicMonths, islamicCalendarFacts } from '@/data/islamicCalendar';

export default function IslamicCalendar() {
  const { language } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState<number>(islamicMonths[0].number);

  const selected = islamicMonths.find(m => m.number === selectedMonth) ?? islamicMonths[0];

  const getName = (m: typeof islamicMonths[0]) =>
    language === 'roman-hindi' ? m.nameHi : language === 'roman-telugu' ? m.nameTe : m.nameEn;

  const getDesc = (m: typeof islamicMonths[0]) =>
    language === 'roman-hindi' ? m.descriptionHi : language === 'roman-telugu' ? m.descriptionTe : m.descriptionEn;

  const getFactText = (f: typeof islamicCalendarFacts[0]) =>
    language === 'roman-hindi' ? f.textHi : language === 'roman-telugu' ? f.textTe : f.textEn;

  const getFactTitle = (f: typeof islamicCalendarFacts[0]) =>
    language === 'roman-hindi' ? f.titleHi : language === 'roman-telugu' ? f.titleTe : f.titleEn;

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold font-serif text-primary mb-3">Islamic Calendar</h1>
        <p className="text-2xl font-serif text-primary/70 mb-2" dir="rtl">التَّقْوِيمُ الْهِجْرِيّ</p>
        <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
          The 12 months of the Hijri (lunar) calendar — with key Islamic dates and events.
        </p>
      </div>

      <IslamicDivider />

      {/* Calendar facts */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {islamicCalendarFacts.map((fact, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-base font-bold font-serif text-primary mb-2">{getFactTitle(fact)}</h3>
            <p className="text-sm font-sans text-foreground/80 leading-relaxed">{getFactText(fact)}</p>
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-8">
        {islamicMonths.map(month => (
          <button
            key={month.number}
            data-testid={`month-${month.number}`}
            onClick={() => setSelectedMonth(month.number)}
            className={`relative rounded-xl p-2 text-center transition-all hover:-translate-y-0.5 hover:shadow-md ${
              selectedMonth === month.number
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card border border-border text-foreground hover:border-primary/40'
            }`}
          >
            <span className={`text-xs font-bold block mb-0.5 ${selectedMonth === month.number ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
              {String(month.number).padStart(2, '0')}
            </span>
            <span className="text-sm font-serif font-semibold leading-tight block">{month.nameEn}</span>
            {month.events.some(e => e.isHighlighted) && (
              <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center ${
                selectedMonth === month.number ? 'bg-yellow-300' : 'bg-yellow-400'
              }`}>
                <Star className="w-2 h-2 text-yellow-900" fill="currentColor" />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Selected month detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedMonth}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {/* Month header */}
          <div className={`bg-gradient-to-br ${selected.color} rounded-2xl p-6 mb-6 text-white`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-sm font-sans font-medium">Month {selected.number} of 12</p>
                <h2 className="text-3xl font-bold font-serif mt-1">{getName(selected)}</h2>
              </div>
              <p
                className="text-3xl font-serif text-right text-white/90"
                dir="rtl"
                style={{ fontFamily: "'Amiri', serif" }}
              >
                {selected.nameAr}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <p className="text-base font-sans text-foreground/90 leading-relaxed">{getDesc(selected)}</p>
          </div>

          {/* Events */}
          {selected.events.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold font-serif text-primary">Key Dates in {selected.nameEn}</h3>
              </div>
              <div className="space-y-4">
                {selected.events.map((event, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`flex gap-4 p-4 rounded-xl border ${
                      event.isHighlighted
                        ? 'border-yellow-300/50 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-500/20'
                        : 'border-border bg-muted/20'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-sans shrink-0 ${
                      event.isHighlighted
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {event.day}
                    </div>
                    <div>
                      <p className="font-semibold font-serif text-foreground">
                        {event.isHighlighted ? <GoldenText>{event.name}</GoldenText> : event.name}
                      </p>
                      <p className="text-sm font-sans text-muted-foreground leading-relaxed mt-0.5">{event.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {selected.events.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-sans">No specific highlighted events this month — a time for consistent worship and reflection.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-12">
        <IslamicDivider className="opacity-50 mb-6" />
        <div className="text-center">
          <p className="text-sm text-muted-foreground font-sans">
            The Prophet (SAW) said: "Verily, the number of months with Allah is twelve months in the Book of Allah
            from the day He created the heavens and earth. Of them, four are sacred." — Quran 9:36
          </p>
        </div>
      </div>
    </div>
  );
}
