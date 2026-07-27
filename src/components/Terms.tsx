export default function Terms() {
  return (
    <div className="min-h-full bg-background">
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-serif text-primary mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: July 2026</p>
        </div>
        <div className="space-y-6">
          {[
            { title: "Acceptance of Terms", content: "By accessing and using Learn Islam, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service." },
            { title: "Use of Content", content: "All Islamic content on Learn Islam including Prophet Stories, Duas, Hadiths and Quran verses are provided for educational and spiritual purposes only. The content is based on authentic Islamic sources." },
            { title: "User Conduct", content: "You agree to use Learn Islam only for lawful purposes. You must not use the app in any way that violates applicable local, national or international law or regulation." },
            { title: "Intellectual Property", content: "The Learn Islam app and its original content, features and functionality are owned by Learn Islam and are protected by international copyright, trademark and other intellectual property laws." },
            { title: "Disclaimer", content: "Learn Islam is provided on an as-is basis. We make no warranties expressed or implied regarding the accuracy, completeness or reliability of any Islamic content provided." },
            { title: "Changes to Terms", content: "We reserve the right to modify these terms at any time. We will notify users of any significant changes. Your continued use of the app after changes constitutes acceptance." },
            { title: "Contact", content: "If you have any questions about these Terms of Service, please contact us on Instagram at @Simple_sohel." }
          ].map((section, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold font-serif text-primary mb-3">{section.title}</h2>
              <p className="text-foreground/80 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}