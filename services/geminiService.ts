
import { GoogleGenAI, Type } from "@google/genai";
import { AnimalData, GroundingSource } from "../types";

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getAnimalDetails = async (animalName: string): Promise<AnimalData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are FaunaSphere AI, a world-class senior zoologist. 
      
      STRICT VALIDATION PROTOCOL:
      1. Analyze the query: "${animalName}".
      2. Determine if it is a real biological animal species (extant or extinct).
      3. If the input is NOT an animal (e.g., it is a plant, fungus, bacteria, human individual, fictional character, place, inanimate object, or abstract concept), you MUST set "isAnimal" to false.
      4. If "isAnimal" is false:
         - Provide 3 real animal species as "suggestions".
         - You may leave other scientific fields empty or placeholder strings.
      5. If "isAnimal" is true, proceed with a full scientifically grounded report:
         - Cross-reference primarily with Wikipedia and reputable sources like IUCN Red List.
         - "visualDescriptionForAi": Provide a hyper-specific anatomical blueprint of this species for a scientific illustrator.
         - "wikipediaSummary": Provide a high-quality, dense paragraph based on Wikipedia.
         - "funFacts": Provide exactly 2 unique scientific insights.
         - "scientificLiterature": List 2-3 real peer-reviewed papers.
         - "quiz": Exactly 3 multiple-choice questions.

      Format strictly as JSON.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isAnimal: { type: Type.BOOLEAN },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            commonName: { type: Type.STRING },
            scientificName: { type: Type.STRING },
            taxonomy: {
              type: Type.OBJECT,
              properties: {
                kingdom: { type: Type.STRING },
                phylum: { type: Type.STRING },
                class: { type: Type.STRING },
                order: { type: Type.STRING },
                family: { type: Type.STRING },
                genus: { type: Type.STRING },
                species: { type: Type.STRING }
              },
              required: ["kingdom", "phylum", "class", "order", "family", "genus", "species"]
            },
            evolutionaryHistory: { type: Type.STRING },
            habitat: { type: Type.STRING },
            habitatMapRegions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  latitude: { type: Type.NUMBER },
                  longitude: { type: Type.NUMBER }
                },
                required: ["name", "latitude", "longitude"]
              }
            },
            diet: { type: Type.STRING },
            physicalFeatures: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            visualDescriptionForAi: { type: Type.STRING },
            behavior: { type: Type.STRING },
            roleInEcosystem: { type: Type.STRING },
            threats: {
              type: Type.OBJECT,
              properties: {
                level: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["level", "description"]
            },
            wikipediaSummary: { type: Type.STRING },
            aiResearchMethodology: { type: Type.STRING },
            funFacts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              minItems: 2,
              maxItems: 2
            },
            scientificLiterature: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  authors: { type: Type.STRING },
                  year: { type: Type.NUMBER },
                  journal: { type: Type.STRING }
                },
                required: ["title", "authors", "year", "journal"]
              }
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswerIndex: { type: Type.NUMBER },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "options", "correctAnswerIndex", "explanation"]
              }
            }
          },
          required: [
            "isAnimal", "commonName", "scientificName", "taxonomy", "evolutionaryHistory",
            "habitat", "habitatMapRegions", "diet", "physicalFeatures", "visualDescriptionForAi",
            "behavior", "roleInEcosystem", "threats", "wikipediaSummary", "aiResearchMethodology", "funFacts", "scientificLiterature", "quiz"
          ]
        }
      }
    });

    let jsonText = response.text;
    if (!jsonText) {
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) if (part.text) { jsonText = part.text; break; }
    }
    const cleanJson = jsonText.replace(/^```json\n?|\n?```$/g, "").trim();
    const data = JSON.parse(cleanJson) as AnimalData;
    
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
      data.sources = groundingMetadata.groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({ title: chunk.web.title, uri: chunk.web.uri }))
        .slice(0, 5);
    }
    return data;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

const fetchSingleImagePro = async (ai: any, prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: { 
        imageConfig: { aspectRatio: "16:9", imageSize: "1K" },
        tools: [{ googleSearch: {} }] 
      },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return "";
  } catch (e: any) {
    console.warn("Pro Image gen error:", e);
    try {
      const fallbackAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const fallback = await fallbackAi.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } },
      });
      for (const part of fallback.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (err) {
      console.error("Critical image failure:", err);
    }
    return "";
  }
};

export const generateAnimalImages = async (animal: AnimalData): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const basePrompt = `BIOLOGICAL SPECIES IDENTIFICATION PROTOCOL: ${animal.commonName} (${animal.scientificName}). 
  ANATOMICAL BLUEPRINT: ${animal.visualDescriptionForAi}. 
  CRITICAL: Cross-reference with scientific records. Zero artistic license allowed. 
  CONTEXT: ${animal.habitat}. 
  STYLE: Ultra-sharp, 8k scientific documentary wildlife photography. Realistic lighting and textures.`;

  const prompts = [
    `${basePrompt} Full-body profile view showing exact anatomical proportions.`,
    `${basePrompt} Extreme close-up macro portrait focusing on unique facial markers.`
  ];

  const results = await Promise.all(prompts.map(p => fetchSingleImagePro(ai, p)));
  const validUrls = results.filter(url => url !== "");
  
  return validUrls.length > 0 ? validUrls : [`https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=80&w=1200`];
};
