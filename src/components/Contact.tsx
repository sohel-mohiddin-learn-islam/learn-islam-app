export default function Contact() {
  return (
    <div className="min-h-full bg-background">
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-serif text-primary mb-2">Contact Us</h1>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold font-serif text-primary mb-4">Get in Touch</h2>
          <p className="text-lg text-foreground/80 mb-4">We love hearing from our users! For any questions, suggestions or feedback about Learn Islam app, reach out to us.</p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
              <span className="text-2xl">📸</span>
              <div>
                <p className="font-bold text-foreground">Instagram</p>
                <p className="text-primary">@Simple_sohel</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
              <span className="text-2xl">🌐</span>
              <div>
                <p className="font-bold text-foreground">Website</p>
                <p className="text-primary">nabi-stories--sadf38038.replit.app</p>
              </div>
            </div>
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