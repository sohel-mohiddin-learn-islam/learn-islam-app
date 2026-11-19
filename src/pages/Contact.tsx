import PageHero from "@/components/PageHero";
export default function Contact() {
  return (
    <div className="min-h-full bg-background">
      <div className="max-w-3xl mx-auto p-6">
        <PageHero tone="indigo" title="Contact Us" subtitle="Questions, ideas or feedback? We would love to hear from you." />
        <div className="bg-card border border-border rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold font-serif text-primary mb-4">Get in Touch</h2>
          <p className="text-lg text-foreground/80 mb-4">We love hearing from our users! For any questions, suggestions or feedback about Learn Islam app, reach out to us.</p>
          <div className="space-y-4">
            <a href="https://www.instagram.com/learn_islam_official_?hvrq=YTFubjQ5bGNmMW1p" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-muted rounded-xl">
              <span className="text-2xl">📸</span>
              <div>
                <p className="font-bold text-foreground">Instagram</p>
                <p className="text-primary break-all">instagram.com/learn_islam_official_</p>
              </div>
            </a>
            <a href="https://noorgunturdigitals.lovable.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-muted rounded-xl">
              <span className="text-2xl">🌐</span>
              <div>
                <p className="font-bold text-foreground">Website</p>
                <p className="text-primary break-all">noorgunturdigitals.lovable.app</p>
              </div>
            </a>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold font-serif text-primary mb-4">Feedback</h2>
          <p className="text-foreground/80">Your feedback helps us improve Learn Islam for everyone. Please share your thoughts, report issues, or suggest new features by reaching out on Instagram.</p>
        </div>
      </div>
    </div>
  );
}