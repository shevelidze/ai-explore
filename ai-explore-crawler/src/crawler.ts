import 'dotenv/config';
import PQueue from 'p-queue';
import { AiExploreRepository } from 'ai-explore-shared/repositories/ai-explore';
import { tokenizer } from 'ai-explore-shared/utils/tokenizer';
import { EMBEDDING_MODEL_LIMIT } from 'ai-explore-shared/constants/embedding-model-limit';
import { TextEmbeddingService } from 'ai-explore-shared/services/text-embedding';
import { PageData } from './types/page-data';
import { PageParser } from './page-parser';
import { log } from './log';
import { splitIntoOverlappingChunks } from './utils/split-into-overlapping-chunks';
import { Pinecone } from '@pinecone-database/pinecone';
import { serializeError } from 'serialize-error';
import fs from 'fs/promises';

const CRAWLING_CONCURRENCY_LIMIT = 50;
const PAGE_REQUEST_TIMEOUT = 2000;

class GetPageDataError extends Error {}

class Crawler {
  constructor() {
    this.aiExploreRepository = new AiExploreRepository(
      process.env.DATABASE_URL as string
    );
    this.textEmbeddingService = new TextEmbeddingService(
      process.env.OPENAI_API_KEY as string
    );

    this.queue = new PQueue({ concurrency: CRAWLING_CONCURRENCY_LIMIT });
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY as string,
    });
  }

  public async crawlUncrawled() {
    const pagesToCrawl = await this.getPagesToCrawl();

    const queue = new PQueue({ concurrency: CRAWLING_CONCURRENCY_LIMIT });

    const logQueueStatus = () => {
      log('Pages in queue:', queue.size);
      log('Pages being crawled:', queue.pending);
    };

    pagesToCrawl.forEach((page) => {
      queue.add(async () => {
        log('Starting to crawl:', page.dataValues.url);
        logQueueStatus();

        await this.crawl(page.dataValues.url, page.dataValues.id);

        log('Finished crawling:', page.dataValues.url);
        logQueueStatus();
      });
    });

    await queue.onIdle();
  }

  public async crawl(url: string, pageId: number) {
    try {
      const pageData = await this.getPageData(url);

      if (pageData.outgoingUrls.length > 0) {
        await this.aiExploreRepository.addPages(pageData.outgoingUrls);
      }

      const tokenizedText = tokenizer.encode(pageData.text);
      const tokenizedChunks = splitIntoOverlappingChunks(
        tokenizedText,
        EMBEDDING_MODEL_LIMIT,
        200
      );

      const chunks = tokenizedChunks.map((chunk) => tokenizer.decode(chunk));

      if (chunks.length === 0) {
        throw new GetPageDataError('Empty text');
      }

      const index = this.getPineconeIndex();
      const namespaceName = this.getPageNamespaceName(pageId);
      const namespace = index.namespace(namespaceName);

      const indexStats = await index.describeIndexStats();

      if (
        indexStats.namespaces &&
        indexStats.namespaces.hasOwnProperty(namespaceName)
      ) {
        await namespace.deleteAll();
      }

      const embeddings = await this.textEmbeddingService.createEmbedding(
        chunks
      );

      await namespace.upsert(
        embeddings.map((embedding, index) => {
          return {
            id: this.getEmbeddingId(pageId, index),
            values: embedding,
          };
        })
      );

      await this.aiExploreRepository.markPageAsCrawled(url, pageData);
    } catch (e) {
      if (e instanceof GetPageDataError) {
        await this.aiExploreRepository.markPageAsInvalid(url, e.message);
      } else {
        await this.saveError(e);
      }
    }
  }

  public async stop() {
    this.queue.clear();
  }

  public async connect() {
    await this.aiExploreRepository.connect();
  }

  public async disconnect() {
    if (this.queue.size > 0 || this.queue.pending > 0) {
      await this.stop();
    }

    await this.aiExploreRepository.disconnect();
  }

  private async saveError(error: unknown) {
    serializeError(error);

    await fs.mkdir('./errors', { recursive: true });
    await fs.writeFile(
      `./errors/error-${new Date().toISOString()}.json`,
      JSON.stringify(error, null, '\t')
    );
  }

  private getPineconeIndex() {
    return this.pinecone.index(process.env.PINECONE_INDEX_NAME as string);
  }

  private getPageNamespaceName(pageId: number) {
    return `page-${pageId}`;
  }

  private getEmbeddingId(pageId: number, chunkIndex: number) {
    return `${pageId}-${chunkIndex}`;
  }

  private async getPageData(url: string): Promise<PageData> {
    const abortController = new AbortController();

    try {
      const response = await fetch(url, {
        signal: abortController.signal,
      });

      setTimeout(
        () => abortController.abort('Request timeout'),
        PAGE_REQUEST_TIMEOUT
      );

      if (response.headers.get('content-type')?.indexOf('text/html') === -1) {
        throw new GetPageDataError('Invalid content type');
      }

      if (!response.ok) {
        throw new GetPageDataError(`Returned ${response.status}`);
      }

      const responseText = await response.text();

      const pageParser = new PageParser(responseText, url);

      return {
        metaDescription: pageParser.getMetaDescription() ?? undefined,
        text: pageParser.getText(),
        title: pageParser.getTitle(),
        outgoingUrls: pageParser.getOutgoingUrls(),
      };
    } catch (e) {
      throw new GetPageDataError(this.getErrorMessage(e));
    }
  }

  private getErrorMessage(error: unknown) {
    return typeof error === 'object' && error && 'message' in error
      ? String(error.message)
      : undefined;
  }

  private async getPagesToCrawl() {
    let pagesToCrawl =
      await this.aiExploreRepository.getPagesThatNeedToBeCrawled();

    if (pagesToCrawl.length === 0) {
      await this.aiExploreRepository.addSeedPages();
    }

    pagesToCrawl = await this.aiExploreRepository.getPagesThatNeedToBeCrawled();

    return pagesToCrawl;
  }

  private queue: PQueue;
  private aiExploreRepository: AiExploreRepository;
  private pinecone: Pinecone;
  private textEmbeddingService: TextEmbeddingService;
}

export { Crawler };
