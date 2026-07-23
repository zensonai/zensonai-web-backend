import { Injectable } from "@nestjs/common";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OllamaService {

    // private readonly ollamaUrl = "http://localhost:11434";
    private readonly gemini: GoogleGenAI;


    constructor(
        private readonly configService: ConfigService,
    ) {
        this.gemini = new GoogleGenAI({
            apiKey: this.configService.get<string>("GEMINI_API_KEY"),
        });

    }

    async createEmbedding(text: string): Promise<number[]> {

        const response = await this.gemini.models.embedContent({
            model: "gemini-embedding-001",
            contents: text,
        });

        if (!response.embeddings || response.embeddings.length === 0) {
            throw new Error("Failed to generate embedding");
        }

        return response.embeddings[0].values ?? [];
    }


    async generateAnswer(
        question: string,
        context: string,
    ): Promise<string> {

        const prompt = `
            You are Zenson's AI assistant.

            Your job is to help users professionally.

            IMPORTANT RULES:

            1. For greetings or casual messages:
            - Reply naturally.
            - Do not use provided information.
            - Be friendly and helpful.
            - You can say:
            "Hello! Welcome to Zenson. How can I help you today? Do you have any questions for the Zenson team?"

            2. For Zenson/company-related questions:
            - Answer only using the provided information.
            - Do not use external knowledge.
            - Do not make assumptions.
            - If the user asks for multiple items, include all available items.

            3. If information is unavailable:
            - Never mention documents.
            - Never mention uploaded files.
            - Never mention context.
            - Never mention databases or internal systems.
            - Never say:
            "I cannot find this information in the uploaded documents."

            Instead reply:
            "I don't have enough information to answer that accurately. Could you please provide more details?"

            4. Keep responses:
            - Professional
            - Clear
            - Helpful
            - Natural

            Company Information:
            ${context}

            User Question:
            ${question}

            Answer:
        `;

        const response = await this.gemini.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: prompt,
            config: {
                maxOutputTokens: 1000,
                temperature: 0.1,
                topP: 0.9,
            },
        });


        return response.text ?? "";
    }

}