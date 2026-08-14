import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3.5-flash';

function getErrorMessage(error) {
  if (error?.error?.message) return error.error.message;
  if (typeof error?.message === 'string') {
    try {
      const parsed = JSON.parse(error.message);
      return parsed?.error?.message || error.message;
    } catch {
      return error.message;
    }
  }
  return 'Failed to generate AI response.';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    const { message, systemPrompt, image } = req.body || {};

    if (!message && !image?.data) {
      return res.status(400).json({ error: 'Message or image is required' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const parts = [{ text: message || 'Extract all trip booking or event details from this image into itinerary items.' }];
    if (image?.data) {
      parts.push({ inlineData: { mimeType: image.mimeType || 'image/png', data: image.data } });
    }

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    return res.status(200).json({ text: response.text });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
