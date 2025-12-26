
import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not set in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePhotoCaption = async (imageBase64: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "API Key Missing";

  try {
    const base64Data = imageBase64.split(',')[1] || imageBase64;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          {
            text: "请用简短、风趣、文艺的中文（或者带一点英文）为这张拍立得照片写一句手写备注。不要超过15个字。直接返回内容，不要引号。",
          },
        ],
      },
    });

    return response.text?.trim() || "美好瞬间";
  } catch (error) {
    console.error("Error generating caption:", error);
    return "回忆...";
  }
};
