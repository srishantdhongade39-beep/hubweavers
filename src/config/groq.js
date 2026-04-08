const getApiKey = () => import.meta.env.VITE_GROQ_API_KEY;

export const generateMentorResponse = async (userMessage, contextData = {}, onChunk = null) => {
  const apiKey = getApiKey();
  if (!apiKey) return "Error: Groq API Key is missing. Please set VITE_GROQ_API_KEY in your .env file.";

  const systemInstruction = `You are SimZone Mentor, a beginner-friendly Indian stock market trading coach. Always use the real data provided. Never give generic advice. Always explain WHY in simple language. Use ₹ for all prices. Keep responses under 5 sentences. Use a warm, encouraging tone.`;

  const promptText = `
Context Data:
User Portfolio Value: ${contextData.portfolioValue || 'Unknown'}
Available Balance: ${contextData.virtualBalance || 'Unknown'}
Active Instrument: ${contextData.instrument || 'Unknown'}
Current Price: ${contextData.price || 'Unknown'}
Day High: ${contextData.dayHigh || 'Unknown'}
Day Low: ${contextData.dayLow || 'Unknown'}
Percent Change Today: ${contextData.percentChange || 'Unknown'}
Recent Trade History: ${contextData.tradeHistory ? JSON.stringify(contextData.tradeHistory) : 'None'}
Positions Held: ${contextData.positions ? JSON.stringify(contextData.positions) : 'None'}

Action Taken/Question: ${userMessage}
`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: promptText }
        ],
        temperature: 0.7,
        max_tokens: 1024,
        stream: !!onChunk // Use streaming if callback is provided
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("Groq API Error details RAW:", errText);
        throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    if (onChunk) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullContent = "";
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep the last partial line
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine === "data: [DONE]") return fullContent;
          if (trimmedLine.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(trimmedLine.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              // If content exists, append it. (Even if empty string, we should ignore, but if it has characters we append it)
              if (content) {
                fullContent += content;
                onChunk(fullContent);
              }
            } catch (e) {
              console.error("Failed to parse SSE JSON:", e);
            }
          }
        }
      }
      return fullContent;
    } else {
      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error("No candidates returned from Groq.");
      }
    }
  } catch (error) {
    console.error("Groq API Error:", error);
    return `Oops! I encountered an error: ${error.message}`;
  }
};
