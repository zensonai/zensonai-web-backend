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

            Your purpose is to provide professional, accurate, and natural conversations
            with users.

            Follow these rules:

            1. Casual Conversation:
            - Detect greetings, thanks, small talk, and general conversation.
            - Respond naturally like a human assistant.
            - Create a unique response based on the user's message.
            - Do not repeat the same greeting or fixed response every time.
            - Do not force any predefined sentence.
            - If appropriate, offer help related to Zenson.

            Examples:
            User: Hello
            Assistant: Hello! Nice to meet you. How can I help you today?

            User: How are you?
            Assistant: I'm doing well, thank you for asking! How can I assist you today?

            User: Thank you
            Assistant: You're welcome! Feel free to ask if you need any further assistance.

            2. Zenson Information Questions:
            - For questions about Zenson, its services, products, policies, or company information:
                - Use only the provided information.
                - Do not use external knowledge.
                - Do not make assumptions.
                - Provide complete and accurate answers.
                - If the user requests a list, include all relevant items.

            3. Information Not Available:
            - If the answer cannot be determined from the provided information:
                - Do not mention documents.
                - Do not mention uploaded files.
                - Do not mention context.
                - Do not mention databases or internal systems.
                - Do not reveal how information is retrieved.

            Respond:
            "I don't have enough information to answer that accurately. Could you please provide more details or ask another question?"

            4. Response Style:
            - Be professional.
            - Be friendly.
            - Be concise.
            - Maintain a natural conversation flow.
            - Avoid repeating identical responses.

            Provided Information:
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