function cleanAITriageOutput(rawText: string): string {
  if (!rawText) return "No triage generated.";
  
  // 1. Remove markdown code block wrappers like ```json or ```
  let cleaned = rawText.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '');
  
  // 2. Replace all newlines and carriage returns with a single space
  cleaned = cleaned.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  
  // 3. Remove any surrounding backticks or stray quotes
  cleaned = cleaned.replace(/^[`"]+|[`"]+$/g, '').trim();
  
  return cleaned;
}

export async function triageWithAI(text: string): Promise<string> {
  if (!text || text.trim() === "") {
    return "No content to triage.";
  }

  const prompt = `You are an AI triage assistant for a Discord community moderator team. Analyze the following report or feedback text. Provide a single line of text formatted exactly like: 'Category: <Bug/Spam/Feature/Other> | Priority: <High/Medium/Low> | Summary: <concise 1-sentence summary>'. Do not include any line breaks, bullet points, or markdown code blocks. Text to triage:\n\n"${text}"`;

  // 1. Try Google Gemini API (Free Tier via AI Studio using reliable gemini-1.5-flash)
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey && geminiKey !== "your_free_google_gemini_api_key") {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 150 }
        })
      });
      if (response.ok) {
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (aiText) return cleanAITriageOutput(aiText);
      } else {
        console.error("Gemini API error:", await response.text());
      }
    } catch (e) {
      console.error("Error calling Gemini API:", e);
    }
  }

  // 2. Try Groq API (Free Tier)
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey && groqKey !== "your_free_groq_api_key") {
    try {
      const url = "https://api.groq.com/openai/v1/chat/completions";
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 150
        })
      });
      if (response.ok) {
        const data = await response.json();
        const aiText = data.choices?.[0]?.message?.content?.trim();
        if (aiText) return cleanAITriageOutput(aiText);
      } else {
        console.error("Groq API error:", await response.text());
      }
    } catch (e) {
      console.error("Error calling Groq API:", e);
    }
  }

  // 3. Fallback simulation if no API key is configured yet
  const lower = text.toLowerCase();
  let category = "Other";
  let priority = "Low";
  if (lower.includes("bug") || lower.includes("error") || lower.includes("fail") || lower.includes("crash") || lower.includes("broken") || lower.includes("issue") || lower.includes("problem")) {
    category = "Bug";
    priority = "High";
  } else if (lower.includes("spam") || lower.includes("scam") || lower.includes("urgent") || lower.includes("hack") || lower.includes("link")) {
    category = "Spam";
    priority = "High";
  } else if (lower.includes("feature") || lower.includes("add") || lower.includes("please") || lower.includes("would be nice") || lower.includes("suggest") || lower.includes("idea")) {
    category = "Feature";
    priority = "Medium";
  }
  
  return `Category: ${category} | Priority: ${priority} | Summary: User reported: ${text.slice(0, 50)}${text.length > 50 ? '...' : ''} (Simulated triage - add GEMINI_API_KEY to .env for live AI)`;
}
