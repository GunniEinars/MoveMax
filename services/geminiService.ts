

import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem, StorageUnit, ContainerScanResult, DestinationZone } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateMoveSummary = async (inventory: InventoryItem[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const totalItems = inventory.reduce((acc, item) => acc + item.quantity, 0);
        resolve(`Project Scope Analysis: This relocation involves ${totalItems} tagged assets. Critical handling required for executive furniture and IT infrastructure.`);
      }, 1000);
    });
  }

  try {
    const inventoryText = inventory.map(item => 
      `- ${item.quantity}x ${item.name} (${item.room})${item.isFragile ? ' [FRAGILE/HIGH VALUE]' : ''}`
    ).join('\n');

    const prompt = `
      You are a Corporate Relocation Project Manager. Write a concise, professional executive summary for the client regarding this inventory.
      Focus on volume, high-value assets, and logistical complexity.
      
      Inventory:
      ${inventoryText}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating AI summary.";
  }
};

export const analyzeDestinationMap = async (base64Image: string): Promise<DestinationZone[]> => {
  const ai = getAiClient();
  if (!ai) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 'z1', name: 'Room 301 (Exec)', floor: '3' },
          { id: 'z2', name: 'Room 302', floor: '3' },
          { id: 'z3', name: 'Room 303', floor: '3' },
          { id: 'z4', name: 'Conference A', floor: '3' },
          { id: 'z5', name: 'Open Bullpen North', floor: '3' },
        ]);
      }, 1500);
    });
  }

  try {
    const prompt = `
      Analyze this floorplan image of a new office space.
      Identify all room numbers, names, and distinct zones (like "Conference Room" or "Open Area").
      Return a JSON array.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Room name or number e.g. Room 101" },
              floor: { type: Type.STRING, description: "Floor number if visible, else '1'" },
              capacity: { type: Type.NUMBER, description: "Estimated person capacity based on size" }
            }
          }
        }
      }
    });

    if (!response.text) return [];
    const parsed = JSON.parse(response.text);
    return parsed.map((item: any, idx: number) => ({
      ...item,
      id: `zone-${Date.now()}-${idx}`
    }));

  } catch (error) {
    console.error("Gemini Dest Map Error:", error);
    return [];
  }
};

export const analyzeFloorplan = async (base64Image: string): Promise<StorageUnit[]> => {
  const ai = getAiClient();
  
  if (!ai) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: `fp-${Date.now()}-1`,
            name: 'Corner Desk Cluster',
            type: 'Desk',
            location: 'Room 204',
            estimatedCrates: 6,
            subUnits: [],
            detectedFromImage: true
          },
          {
            id: `fp-${Date.now()}-2`,
            name: 'Filing Bank (6 Units)',
            type: 'Cabinet',
            location: 'Hallway B',
            estimatedCrates: 12,
            subUnits: [],
            detectedFromImage: true
          }
        ]);
      }, 1500);
    });
  }

  try {
    const prompt = `
      Analyze this architectural floorplan image.
      Identify furniture and storage units represented by symbols (rectangles, squares, desk shapes).
      Group them by Room if room numbers/names are visible.
      
      Return a JSON array of objects with:
      - name: e.g. "Workstation Cluster" or "File Cabinet"
      - type: "Desk" | "Cabinet" | "Shelf"
      - location: e.g. "Room 101" or "Open Area" (infer from context text nearby)
      - estimatedCrates: Estimate based on size (1 crate per 3 sq ft of storage).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING },
              location: { type: Type.STRING },
              estimatedCrates: { type: Type.NUMBER }
            }
          }
        }
      }
    });

    if (!response.text) return [];
    const parsed = JSON.parse(response.text);
    return parsed.map((item: any, idx: number) => ({
      ...item,
      id: `ai-fp-${Date.now()}-${idx}`,
      detectedFromImage: true,
      subUnits: []
    }));

  } catch (error) {
    console.error("Gemini Floorplan Error:", error);
    return [];
  }
};

export const analyzeCabinetContents = async (base64Image: string): Promise<ContainerScanResult> => {
    // Deprecated alias, mapping to new function for compatibility
    return analyzeDrawerContents(base64Image);
};

export const analyzeDrawerContents = async (base64Image: string): Promise<ContainerScanResult> => {
   const ai = getAiClient();
   if (!ai) {
     return new Promise(resolve => {
       setTimeout(() => resolve({
         id: `scan-${Date.now()}`,
         timestamp: new Date().toISOString(),
         confidence: 0.95,
         items: [
           { type: 'Manila Folder', count: 35, suggestedDisposition: 'Digitize' },
           { type: 'Binder (3-ring)', count: 4, suggestedDisposition: 'Recycle' },
           { type: 'Office Supplies', count: 1, suggestedDisposition: 'Keep' }
         ]
       }), 1500);
     });
   }

   try {
     const prompt = `
       You are a Space Optimization Auditor. Analyze this image of an open drawer or shelf.
       Count the visible items.
       Identify the CONTENT TYPE (Files, Supplies, Tech, Personal).
       Suggest a DISPOSITION:
       - 'Digitize' for paper files/documents.
       - 'Recycle' for old binders/catalogs.
       - 'Keep' for active supplies or tech.
       
       Return strict JSON.
     `;

     const response = await ai.models.generateContent({
       model: 'gemini-2.5-flash',
       contents: {
         parts: [
           { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
           { text: prompt }
         ]
       },
       config: {
         responseMimeType: 'application/json',
         responseSchema: {
           type: Type.OBJECT,
           properties: {
             items: {
               type: Type.ARRAY,
               items: {
                 type: Type.OBJECT,
                 properties: {
                   type: { type: Type.STRING },
                   count: { type: Type.NUMBER },
                   suggestedDisposition: { type: Type.STRING, enum: ['Keep', 'Resell', 'Donate', 'Recycle', 'Trash', 'Digitize'] }
                 }
               }
             },
             confidence: { type: Type.NUMBER }
           }
         }
       }
     });

     if (!response.text) throw new Error("No response text");
     
     const parsed = JSON.parse(response.text);
     return {
       id: `scan-${Date.now()}`,
       timestamp: new Date().toISOString(),
       items: parsed.items || [],
       confidence: parsed.confidence || 0.8
     };

   } catch (error) {
     console.error("Gemini Content Scan Error:", error);
     return { id: '', timestamp: '', items: [], confidence: 0 };
   }
};

export const analyzeStorageImage = async (base64Image: string): Promise<StorageUnit[]> => {
  const ai = getAiClient();
  
  if (!ai) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'mock-1',
            name: 'Herman Miller Aeron Chair',
            type: 'Chair',
            detectedFromImage: true,
            estimatedCrates: 0,
            location: 'Detected Zone',
            subUnits: []
          }
        ]);
      }, 1500);
    });
  }

  try {
    const prompt = `
      Act as a Corporate Liquidation Consultant. Analyze this office photo. 
      Identify furniture and storage units.
      For each item:
      1. Name it professionally.
      2. Detect sub-units (drawers/shelves).
      3. Assess visual CONDITION (New, Good, Fair, Poor).
      4. Suggest a DISPOSITION (Keep, Resell, Recycle, Trash) based on typical office value.
      
      Return strict JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING },
              estimatedCrates: { type: Type.NUMBER },
              condition: { type: Type.STRING, enum: ['New', 'Good', 'Fair', 'Poor', 'Damaged'] },
              suggestedDisposition: { type: Type.STRING, enum: ['Keep', 'Resell', 'Donate', 'Recycle', 'Trash'] },
              subUnits: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ["drawer", "shelf", "cabinet_space"] },
                    label: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) return [];

    const parsed = JSON.parse(response.text);
    
    return parsed.map((item: any, idx: number) => ({
      ...item,
      id: `ai-asset-${Date.now()}-${idx}`,
      detectedFromImage: true,
      location: 'Detected from Photo',
      subUnits: item.subUnits.map((sub: any, sIdx: number) => ({
        ...sub,
        id: `sub-${Date.now()}-${idx}-${sIdx}`
      }))
    }));

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return [];
  }
};

export const analyzeDamage = async (base64Image: string): Promise<{ description: string; severity: 'Low' | 'Medium' | 'High' | 'Critical' }> => {
  const ai = getAiClient();
  if (!ai) {
     return new Promise(resolve => {
        setTimeout(() => resolve({
           description: "AI Analysis: Visible scratch on surface. No structural compromise detected.",
           severity: "Low"
        }), 1500);
     });
  }

  try {
    const prompt = `
      You are a specialized damage assessor for moving insurance.
      Analyze the photo for damaged furniture or property.
      Provide a concise description of the damage.
      Rate severity: Low (Cosmetic), Medium (Repairable), High (Replacement needed), Critical (Safety hazard).
      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
           type: Type.OBJECT,
           properties: {
              description: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] }
           }
        }
      }
    });

    if (!response.text) throw new Error("No response");
    const parsed = JSON.parse(response.text);
    return {
       description: parsed.description || "Analysis Failed",
       severity: parsed.severity || "Medium"
    };

  } catch (error) {
     console.error("Gemini Damage Analysis Error:", error);
     return { description: "Could not analyze image.", severity: "Medium" };
  }
};
