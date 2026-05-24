const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

/**
 * Calls Gemini API to get a short motivational coaching tip or strategy for the current task.
 * Note: For local development, EXPO_PUBLIC_ prefixed environment variables are used.
 * In a production app, this API key should be stored and called from a secure backend proxy
 * to prevent it from being exposed in client-side bundles.
 */
export async function fetchCoachingTip(taskName: string, durationMinutes: number): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "To receive AI coach tips, please define EXPO_PUBLIC_GEMINI_API_KEY in your .env file.";
  }

  // Using the gemini-2.5-flash model for fast response times
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `You are a supportive, friendly voice-based productivity coach.
The user is about to start or is currently doing the task: "${taskName}" for ${durationMinutes} minutes.
Provide a quick, punchy, motivational coaching tip or focus strategy for this task.
Keep it extremely short (under 2 sentences, maximum 25 words) so it can be easily spoken by a text-to-speech engine. 
Do not include any markdown formatting, asterisks, emojis, or bullet points. Just return raw text.`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 60,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      console.warn("Gemini API request failed:", response.status, response.statusText);
      return `Stay focused on ${taskName}! You've got this.`;
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (generatedText) {
      return generatedText.trim();
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
  }

  return `Make the most of your time on ${taskName}. Focus and take it one step at a time!`;
}
