import HadithBooks from '@/components/HadithBooks';
import PageHero from "@/components/PageHero";
import { IslamicDivider } from '@/components/IslamicDivider';

export default function Hadiths() {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHero tone="amber" title="Hadith Books" arabic="كتب الحديث" subtitle="The sayings and actions of the Prophet ﷺ, by collection." />
      <div className="mt-6">
        <HadithBooks />
      </div>
    </div>
  );
}
