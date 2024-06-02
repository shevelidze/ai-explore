import { Pinecone } from '@pinecone-database/pinecone';
import { AiExploreRepository } from 'ai-explore-shared/repositories/ai-explore';
import { TextEmbeddingService } from 'ai-explore-shared/services/text-embedding';
import { getPageIdFromPineconeId } from '@/helpers/get-page-id-from-pinecone-id';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY as string,
});

const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME as string);

const textEmbeddingService = new TextEmbeddingService(
  process.env.OPEN_AI_API_KEY as string
);

const aiExploreRepository = new AiExploreRepository(
  process.env.DATABASE_URL as string
);

const searchService = {
  async search(query: string) {
    const embeddingInput = [query];

    if (!textEmbeddingService.isInputCorrect(embeddingInput)) {
      return [];
    }

    const [embedding] = await textEmbeddingService.createEmbedding(
      embeddingInput
    );

    const pineconeQueryResult = await pineconeIndex.query({
      vector: embedding,
      topK: 100,
    });

    const pagesIds: number[] = [];

    pineconeQueryResult.matches.forEach((record) => {
      const pageId = getPageIdFromPineconeId(record.id);

      if (pageId && !pagesIds.includes(pageId)) {
        pagesIds.push(pageId);
      }
    });

    const pages = await aiExploreRepository.getPagesByIds(pagesIds);

    return pagesIds.reduce<typeof pages>((acc, pageId) => {
      const page = pages.find((page) => page.id === pageId);

      if (page) {
        acc.push(page);
      }

      return acc;
    }, []);
  },
};

export { searchService };
