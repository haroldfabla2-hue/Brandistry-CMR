
import { GoogleGenAI } from "@google/genai";
import { IrisTeamMember, ChatMessage, IrisAction, IrisActionType, GeminiModel, AgentResult, AssetType, PredictiveInsight } from "../types";
import { IRIS_TEAMS } from "../constants";

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
                 
              4. SHOW ASSET / NAVIGATE
                 - If user asks to see a file/asset: { "type": "SHOW_ASSET", "payload": { "query": "asset name" }, "confirmationText": "Opening asset..." }
                 - If user asks to go to a page: { "type": "NAVIGATE", "payload": { "view": "DASHBOARD" }, "confirmationText": "Navigating..." }

              5. GENERAL CHAT / REPORT (If no database action is required)
                 - If asking for analysis or summary: { "type": "GENERATE_REPORT", "payload": {}, "confirmationText": "Generating analysis..." }
                 - General chat: { "type": "NONE", "payload": {}, "confirmationText": "Response text here..." }

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
                
                Your goal is to break this down into a plan involving specialized teams (Marketing, Design, Development, Strategy, Analysis).
                
                Return a JSON object ONLY (no markdown) with this structure:
                {
                    "analysis": "Brief analysis of the user intent",
                    "plan": [
                        { "step": "Actionable step title", "assignedTeam": "Marketing", "status": "pending", "detailPrompt": "Specific instruction for the specialist agent to execute this step." },
                        { "step": "Actionable step title", "assignedTeam": "Design", "status": "pending", "detailPrompt": "Specific instruction for the specialist agent." }
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

  // REAL AGENT EXECUTION (PHASE 3 UPGRADE)
  async executeAgentTask(agentCategory: string, instruction: string, context: string): Promise<AgentResult> {
      if (!this.ai) return { content: "Error: AI Offline" };

      // Find the persona
      const agent = IRIS_TEAMS.find(t => t.category === agentCategory) || IRIS_TEAMS[0];

      try {
          const response = await this.generateWithFallback(
              `
              CONTEXT:
              ${context}

              TASK:
              ${instruction}

              INSTRUCTIONS:
              You are a ${agent.role} at Brandistry CRM. 
              1. Execute the task professionally.
              2. If the task results in a deliverable (like a Document, Code, Slogan list, or Email), format it clearly.
              
              OUTPUT FORMAT (JSON ONLY):
              {
                 "content": "Your conversational response and explanation of the work done.",
                 "suggestedAsset": {
                    "title": "Title of the deliverable (e.g. 'SEO Strategy Doc')",
                    "type": "DOCUMENT" | "SPREADSHEET" | "IMAGE" | "VIDEO",
                    "content": "The actual body content of the deliverable (Markdown text, code, or table data)."
                 }
              }
              If no asset is needed, 'suggestedAsset' should be null.
              `,
              {
                  systemInstruction: `${agent.systemPrompt} You are a high-performance autonomous agent.`,
                  temperature: 0.7,
                  responseMimeType: "application/json"
              }
          );
          
          const text = response.text || '{}';
          return JSON.parse(text);
      } catch (e) {
          return { content: "Agent encountered an error executing this task." };
      }
  }

  // PREDICTIVE ANALYSIS (PHASE 6 UPGRADE)
  async generatePredictiveAnalysis(projectData: string): Promise<PredictiveInsight> {
     if (!this.ai) return { riskLevel: 'LOW', prediction: 'AI unavailable', recommendation: 'Check connection', impactedProjects: [] };

     try {
        const response = await this.generateWithFallback(
           `
           You are a Predictive Business Intelligence Engine.
           Analyze the following project data for Brandistry CRM.
           
           DATA:
           ${projectData}

           Identify risks, delays, and budget issues.
           Return JSON ONLY.
           {
              "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
              "prediction": "One sentence prediction of the future state.",
              "recommendation": "Strategic advice to mitigate risk.",
              "impactedProjects": ["Project ID 1", "Project ID 2"]
           }
           `,
           {
              responseMimeType: "application/json",
              model: 'gemini-3-pro-preview' // Use smarter model for analysis
           }
        );
        return JSON.parse(response.text || '{}');
     } catch (e) {
        console.error("Predictive analysis failed", e);
        return { riskLevel: 'LOW', prediction: 'Analysis failed', recommendation: 'Retry later', impactedProjects: [] };
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
