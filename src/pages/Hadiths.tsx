import HadithBooks from '@/components/HadithBooks';
import { IslamicDivider } from '@/components/IslamicDivider';

export default function Hadiths() {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-bold font-serif text-primary mb-2">Hadith Books</h1>
        <p className="text-2xl font-serif text-primary/70" dir="rtl">كتب الحديث</p>
      </div>
      <IslamicDivider />
      <div className="mt-6">
        <HadithBooks />
      </div>
    </div>
  );
}
