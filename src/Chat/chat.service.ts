import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { DocumentChunk, DocumentChunkDocument } from "src/admin/schema/chunk.schema";
import { OllamaService } from "src/ragAi/ollama.service";
import { VectorService } from "src/ragAi/vector.service";

@Injectable()
export class ChatService {
    constructor(

        @InjectModel(DocumentChunk.name, 'atlas')
        private documentchunkModelAtles: Model<DocumentChunkDocument>,
        

        private readonly ollamaService: OllamaService,
        private readonly vectorService: VectorService,
    ) { }

    async askQuestion(question: string) {

        const questionEmbedding =
            await this.ollamaService.createEmbedding(question);

        const chunks =
            await this.documentchunkModelAtles.find().lean();

        const similarChunks =
            this.vectorService.search(
                questionEmbedding,
                chunks,
                5
            );

        const context =
            similarChunks.map(c => c.text).join("\n\n");


        const answer =
            await this.ollamaService.generateAnswer(
                question,
                context
            );


        return {
            question,
            answer
        };
    }
}