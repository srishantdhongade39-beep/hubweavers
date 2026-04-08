const getApiKey = () => import.meta.env.VITE_GROQ_API_KEY;

export const generateMentorResponse = async (userMessage, contextData = {}) => {
  const apiKey = getApiKey();
  if (!apiKey) return "Error: Groq API Key is missing. Please set VITE_GROQ_API_KEY in your .env file.";

  const systemInstruction = `You are the **SimZone AI Mentor**, an expert financial advisor and trading coach integrated directly into a learning trading terminal.
Your goal is to guide students through paper trading, explain complex financial concepts simply, and evaluate their virtual trades.
Rules:
1. Always be encouraging but realistic about market risks.
2. If the user makes a TRADE (BUY/SELL), explain the potential risks/rewards based on the current market data provided.
3. Keep responses concise, easily scannable, and formatted cleanly. Do not use overly long paragraphs. Use emojis where appropriate.
4. You only have access to the context provided in each prompt.`;

  const promptText = `
Context Data:
User Portfolio Value: ${contextData.portfolioValue || 'Unknown'}
Available Balance: ${contextData.virtualBalance || 'Unknown'}
Active Instrument: ${contextData.instrument || 'Unknown'} at ${contextData.price || 'Unknown'}
Action Taken/Question: ${userMessage}

Please respond as the SimZone AI Mentor.
`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Use active Meta LLaMA 3.3 model
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: promptText }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("Groq API Error details RAW:", errText);
        throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    } else {
      throw new Error("No candidates returned from Groq.");
    }
  } catch (error) {
    console.error("Groq API Error:", error);
    return `Oops! I encountered an error: ${error.message}`;
  }
};
