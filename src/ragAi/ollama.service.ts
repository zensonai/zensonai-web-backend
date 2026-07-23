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

            Your role is to provide helpful, accurate, and professional responses
            to users.

            First, identify the type of user message.

            For casual conversations:
            - Respond naturally and professionally.
            - Be friendly and helpful.
            - You may greet users, thank them, or ask:
            "Do you have any questions for the Zenson team, or is there anything I can help you with today?"
            - Do not use the provided context for casual conversation.

            For questions related to company information:
            - Use only the provided context.
            - Provide complete answers based on the available information.
            - If the user requests a list, include all relevant items.
            - Do not provide incomplete examples.
            - Do not use external knowledge or assumptions.

            If the required information is not available:
            - Clearly say that you do not have enough information to answer accurately.
            - Do not guess or create information.
            - Offer assistance with another question.

            Context:
            ${context}

            Question:
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