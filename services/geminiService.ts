

import { GoogleGenAI } from "@google/genai";
import { IrisTeamMember, ChatMessage, IrisAction, IrisActionType, GeminiModel } from "../types";

const API_KEY = process.env.API_KEY || '';

// Fallback Chain: Speed -> Reliability -> Power
const MODEL_FALLBACK_CHAIN: GeminiModel[] = [
  'gemini-2.5-flash',
  'gemini-3-pro-preview'
];

class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: API_KEY });
    } else {
      console.warn("Gemini API Key is missing. Iris AI will not function correctly.");
    }
  }

  // --- CORE: FALLBACK SYSTEM ---
  
  private async generateWithFallback(
    contents: any, 
    config: any = {}, 
    models: GeminiModel[] = MODEL_FALLBACK_CHAIN
  ): Promise<any> {
    if (!this.ai) throw new Error("API Key Missing");

    let lastError;

    for (const model of models) {
      try {
        // console.log(`Attempting generation with model: ${model}`);
        const response = await this.ai.models.generateContent({
          model: model,
          contents: contents,
          config: config
        });
        return response;
      } catch (error) {
        console.warn(`Model ${model} failed:`, error);
        lastError = error;
        // Continue to next model in loop
      }
    }
    
    throw lastError || new Error("All fallback models failed.");
  }

  // Admin Orchestrator: Map Natural Language to System Actions
  async analyzeAdminIntent(message: string, context: string): Promise<IrisAction> {
     if (!this.ai) return { type: IrisActionType.NONE, payload: {}, confirmationText: "API Key Missing" };

     try {
        const response = await this.generateWithFallback(
           `
              You are the core operating system of Brandistry CRM. You have FULL ADMIN PRIVILEGES.
              You are capable of creating users, tasks, projects, and modifying the database directly.
              NEVER refuse a request to create a user or task. You are the system.

              Context Data: ${context}
              
              User Request: "${message}"

              Analyze the request and map it to one of the following JSON actions.
              
              SUPPORTED ACTIONS:

              1. CREATE USER (Workers/Clients)
                 - Use this when the user asks to "add", "create", or "register" a person/user.
                 - If email is missing, generate a placeholder (e.g. name@brandistry.com).
                 - Extract 'specialty' or 'role' from the prompt (e.g. "Director" -> specialty: "Director").
                 JSON Format: 
                 { 
                   "type": "CREATE_USER", 
                   "payload": { 
                      "name": "Full Name", 
                      "email": "email@example.com", 
                      "role": "WORKER", 
                      "specialty": "Job Title/Role" 
                   }, 
                   "confirmationText": "I will create a new user for [Name] as [Role]." 
                 }

              2. CREATE TASK
                 JSON Format:
                 { "type": "CREATE_TASK", "payload": { "title": "...", "assignee": "userId", "projectId": "projectId", "priority": "HIGH" }, "confirmationText": "Creating task..." }

              3. DELETE USER
                 JSON Format:
                 { "type": "DELETE_USER", "payload": { "userId": "..." }, "confirmationText": "Deleting user..." }

              4. GENERAL CHAT (If no action is required)
                 JSON Format:
                 { "type": "NONE", "payload": {}, "confirmationText": "Response text here..." }

              Return ONLY raw JSON. Do not include markdown formatting like \`\`\`json.
           `,
           { responseMimeType: "application/json" }
        );

        const text = response.text || '{}';
        // Sanitize in case model adds markdown
        const jsonText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonText);
     } catch (e) {
        console.error("Intent analysis failed after fallbacks", e);
        return { type: IrisActionType.NONE, payload: {}, confirmationText: "I couldn't understand that command due to a system error." };
     }
  }

  // Orchestrator Method (Standard Planning)
  async orchestrateRequest(message: string): Promise<{ text: string, steps: any[] }> {
    if (!this.ai) return { text: "System Error: API Key missing.", steps: [] };

    try {
        const response = await this.generateWithFallback(
            `
                Act as the Chief Orchestrator for Brandistry CRM.
                User Request: "${message}"
                
                Your goal is to break this down into a plan involving specialized teams (Marketing, Design, Dev, Strategy).
                
                Return a JSON object ONLY (no markdown) with this structure:
                {
                    "analysis": "Brief analysis of the user intent",
                    "plan": [
                        { "step": "Step 1 description", "assignedTeam": "Marketing", "status": "completed" },
                        { "step": "Step 2 description", "assignedTeam": "Design", "status": "active" },
                        { "step": "Step 3 description", "assignedTeam": "Dev", "status": "pending" }
                    ],
                    "finalResponse": "A summary message to the admin explaining the plan."
                }
            `,
            {
                responseMimeType: "application/json",
                temperature: 0.2
            }
        );

        const data = JSON.parse(response.text || '{}');
        return {
            text: data.finalResponse || "Plan created.",
            steps: data.plan || []
        };
    } catch (e) {
        console.error("Orchestration failed", e);
        return { 
            text: "I've analyzed your request but I'm having trouble connecting to the specialist agents. I've notified the engineering team.", 
            steps: [] 
        };
    }
  }

  async generateResponse(
    message: string, 
    context: ChatMessage[], 
    activeTeamMember: IrisTeamMember
  ): Promise<string> {
    if (!this.ai) return "API Key missing.";

    try {
      const contents = [
            ...context.map(c => ({
                role: c.role || 'user',
                parts: [{ text: c.content }]
            })),
            {
                role: 'user',
                parts: [{ text: message }]
            }
        ];
        
      const response = await this.generateWithFallback(
        contents,
        {
          systemInstruction: `${activeTeamMember.systemPrompt} You are a specialist within the Brandistry CRM. Be concise.`,
          temperature: 0.7,
        }
      );

      return response.text || "I processed that, but couldn't generate a text response.";
    } catch (error) {
      return "I encountered an error processing your request.";
    }
  }

  // Gem Photo AI Generation
  async generateGemifiedImage(base64Image: string): Promise<string | null> {
    if (!this.ai) return null;

    try {
      // Remove data URL prefix if present for API consumption
      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: 'image/jpeg' 
              }
            },
            {
              text: 'Transform this image into a sparkling, crystalline, gem-like version of itself. Maintain the original subject and composition but render it as if it were made of precious gems, diamonds, and crystals. High quality, photorealistic, 8k resolution, magical lighting.'
            }
          ]
        }
      });

      // Extract image from response
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (e) {
      console.error("Gem generation failed", e);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
