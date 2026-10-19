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
            ? "Tutor ka secure AI backend abhi configure nahi hai. Backend endpoint setup karna hoga. API key ko app ya GitHub mein mat rakhein."
            : "The secure AI tutor backend isn't configured. A server endpoint is required. Never put provider API keys in the app or GitHub."
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
        const details = await response.text();
        throw new Error(
          `Tutor server returned HTTP ${response.status}: ${details.slice(0, 300)}`
        );
      }

      const data = await response.json();

      if (typeof data.answer !== "string" || !data.answer.trim()) {
        throw new Error("Invalid tutor response: expected a non-empty answer.");
      }

      setMessages((old) => [
        ...old,
        { role: "assistant", content: data.answer }
      ]);
    } catch (error) {
      console.error("AI Tutor request failed:", error);

      const details =
        error instanceof Error ? error.message : String(error);

      setMessages((old) => [
        ...old,
        {
          role: "assistant",
          content: `STAGING DEBUG: ${details.slice(0, 400)}`
        }
      ]);
    } finally {
      setLoading(false);
    }
}
