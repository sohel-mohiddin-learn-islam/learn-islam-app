import PageHero from "@/components/PageHero";
export default function About() {
  return (
    <div className="min-h-full bg-background">
      <div className="max-w-3xl mx-auto p-6">
        <PageHero tone="emerald" title="About Learn Islam" arabic="تعلم الإسلام" subtitle="Authentic Islamic knowledge for everyone, in your language." />

        <div className="bg-card border border-border rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-bold font-serif text-primary mb-4">Our Mission</h2>
          <p className="text-lg leading-relaxed font-sans text-foreground/90">
            Learn Islam is a free Islamic education platform dedicated to making Islamic knowledge accessible to everyone. We provide authentic Islamic content in multiple languages including English, Hindi and Telugu.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-bold font-serif text-primary mb-4">What We Offer</h2>
          <ul className="space-y-3">
            {[
              "Prophet Stories - Inspiring stories of all 25 Prophets",
              "99 Names of Allah (Asmaul Husna) with meanings",
              "Quran Surahs with translations",
              "Daily Duas and supplications",
              "Hadith collection",
              "Story of Karbala",
              "Islamic Calendar",
              "Prayer Guide",
              "Kids Zone for young learners",
              "Companions of the Prophet (Sahabah)"
            ].map((item,i)=>(
              <li key={i} className="flex items-start gap-2 text-foreground/80">
                <span className="text-primary mt-1">★</span>
                <span className="font-sans text-lg">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-bold font-serif text-primary mb-4">Multiple Languages</h2>
          <p className="text-lg leading-relaxed font-sans text-foreground/90">
            Our content is available in English, Hindi (Roman) and Telugu (Roman) to reach Muslims across India and beyond. We believe language should never be a barrier to learning Islam.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-bold font-serif text-primary mb-4">Download Our App</h2>
          <p className="text-lg leading-relaxed font-sans text-foreground/90 mb-4">
            Learn Islam is also available as an Android app. Download it for free from APKPure.
          </p>
          <a href="https://apkpure.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-serif text-lg hover:bg-primary/90 transition-colors">
            Download App
          </a>
        </div>

        <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-6">
          <h2 className="text-2xl font-bold font-serif text-secondary mb-4">Contact Us</h2>
          <p className="text-lg leading-relaxed font-sans text-foreground/80">
            For any questions, suggestions or feedback, please reach out to us on Instagram: <a href="https://www.instagram.com/learn_islam_official_?hvrq=YTFubjQ5bGNmMW1p" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline"><strong>learn_islam_official_</strong></a>
          </p>
        </div>
      </div>
    </div>
  );
}