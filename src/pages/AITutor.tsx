import { useState } from "react";
import { BookOpen, Loader2, MessageCircle, Send, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function AITutor() {
  const { language } = useLanguage();
  const romanHindi = language === "roman-hindi";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: romanHindi
        ? "Assalamu alaikum! Main aapka Islamic learning assistant hoon. Aap Qur'an, duas, namaz aur Islamic history ke baare mein sawal pooch sakte hain. Jawab ko authentic sources se verify karein."
        : "Assalamu alaikum! I'm your Islamic learning assistant. Ask about the Qur'an, duas, salah, or Islamic history. Please verify answers against authentic sources and qualified scholars."
    }
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestions = romanHindi
    ? ["Wuzu ka sahi tareeqa kya hai?", "Ayat-ul-Kursi ka matlab samjhao", "Namaz ki ahmiyat kya hai?"]
    : ["How do I perform wudu?", "Explain Ayat al-Kursi", "Why is salah important?"];

  async function sendQuestion(value = question) {
    const text = value.trim();
    if (!text || loading) return;

    setQuestion("");
    setMessages((old) => [...old, { role: "user", content: text }]);

    const endpoint = import.meta.env.VITE_AI_TUTOR_ENDPOINT as string | undefined;

    if (!endpoint) {
      setMessages((old) => [
        ...old,
        {
          role: "assistant",
          content: romanHindi
            ? "Tutor ka AI backend abhi connect nahi hua hai. Isko chalane ke liye secure server endpoint configure karna hoga. Aapki API key app mein rakhna safe nahi hai."
            : "The AI tutor's secure backend isn't connected yet. Configure a server endpoint to enable real AI answers. Your AI provider key must stay on the server, never in this app."
        }
      ]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          language: romanHindi ? "roman-hindi" : language
        })
      });

      if (!response.ok) {
        throw new Error("Tutor request failed");
      }

      const data = await response.json();
      if (typeof data.answer !== "string" || !data.answer.trim()) {
        throw new Error("Invalid tutor response");
      }

      setMessages((old) => [
        ...old,
        { role: "assistant", content: data.answer }
      ]);
    } catch {
      setMessages((old) => [
        ...old,
        {
          role: "assistant",
          content: romanHindi
            ? "Abhi jawab nahi mil saka. Internet aur secure tutor server check karke dobara koshish karein."
            : "I couldn't get an answer just now. Please check your connection and tutor server, then try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-4 pb-8 sm:p-6">
        <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-5 sm:p-7">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Learn Islam · AI Assistant
          </p>
          <h1 className="font-serif text-2xl font-bold sm:text-3xl">
            {romanHindi ? "Aapka Islamic Tutor" : "Your Islamic Tutor"}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {romanHindi
              ? "Islam ko aasani se seekhein — Qur'an, duas, namaz aur tareekh ke baare mein sawal poochhein."
              : "Explore Islamic knowledge in simple language. Ask about the Qur'an, duas, prayer, and Islamic history."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-border bg-background/70 px-3 py-1.5">📖 Qur'an</span>
            <span className="rounded-full border border-border bg-background/70 px-3 py-1.5">🤲 Duas</span>
            <span className="rounded-full border border-border bg-background/70 px-3 py-1.5">🕌 Salah</span>
            <span className="rounded-full border border-border bg-background/70 px-3 py-1.5">🌙 Islamic history</span>
          </div>
        </section>

        <section className="flex min-h-[340px] flex-col rounded-3xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">
                {romanHindi ? "Islamic sawal-jawab" : "Islamic Q&A"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {romanHindi ? "Adab aur ehtiyat ke saath seekhein" : "Learn with care and respect"}
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-4" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto border border-border bg-muted"
                }`}
              >
                {message.content}
              </div>
            ))}

            {loading && (
              <div className="mr-auto flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {romanHindi ? "Jawab tayyar ho raha hai..." : "Preparing an answer..."}
              </div>
            )}
          </div>

          <div className="border-t border-border p-3 sm:p-4">
            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void sendQuestion();
              }}
            >
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendQuestion();
                  }
                }}
                rows={2}
                maxLength={2000}
                placeholder={romanHindi ? "Apna sawal yahan likhein..." : "Ask your Islamic question..."}
                aria-label={romanHindi ? "Aapka sawal" : "Your question"}
                className="min-w-0 flex-1 resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!question.trim() || loading}
                aria-label={romanHindi ? "Sawal bhejein" : "Send question"}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>

            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={loading}
                  onClick={() => void sendQuestion(suggestion)}
                  className="rounded-full border border-border px-3 py-2 text-left text-xs transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="flex gap-3 rounded-2xl border border-border p-4 text-xs leading-5 text-muted-foreground">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            {romanHindi
              ? "Yeh learning assistant hai, mufti ya alim ka badal nahi. Fiqh ke ikhtilafi ya personal masail ke liye qualified alim se mashwara karein. Qur'an aur Hadith ke hawale verify karein."
              : "This learning assistant is not a substitute for a qualified scholar. For personal rulings or matters where scholars differ, consult a trusted scholar. Verify Qur'an and Hadith references."}
          </p>
        </aside>
      </div>
    </div>
  );
}
