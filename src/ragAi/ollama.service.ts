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
            You are a company document assistant.

            Answer only using the provided context.

            If the question asks for a list, include ALL items from the context.

            Do not provide only one example.

            Do not use general knowledge.

            If the answer is not in the context:
            "I cannot find this information in the uploaded documents."

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