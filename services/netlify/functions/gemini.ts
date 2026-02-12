import { GoogleGenAI } from "@google/genai";

export default async (req: Request) => {
  try {
    const { animalName } = await req.json();

    if (!animalName) {
      return new Response(
        JSON.stringify({ error: "Animal name missing" }),
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.VITE_GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Give scientifically accurate information about the animal "${animalName}".`,
    });

    return new Response(
      JSON.stringify({ result: response.text }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
};
