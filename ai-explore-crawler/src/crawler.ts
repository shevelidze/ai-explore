import 'dotenv/config';
import PQueue from 'p-queue';
import { AiExploreRepository } from 'ai-explore-shared/repositories/ai-explore';
import { tokenizer } from 'ai-explore-shared/utils/tokenizer';
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
      process.env.OPEN_AI_API_KEY as string
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
        256,
        100
      );

      const chunks = tokenizedChunks.map((chunk) => tokenizer.decode(chunk));

      if (chunks.length === 0) {
        throw new GetPageDataError('Empty text');
      }

      await this.clearPageInPinecone(pageId);

      const embeddings = await this.textEmbeddingService.createEmbedding(
        chunks
      );

      const index = this.getPineconeIndex();
      await index.upsert(
        embeddings.map((embedding, index) => {
          return {
            id: this.getIdForPinecone(pageId, index),
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

  private async clearPageInPinecone(pageId: number) {
    const index = this.getPineconeIndex();

    const recordsToClear = await index.listPaginated({
      prefix: this.getPageIdPrefixForPinecone(pageId),
    });

    const vectorsIds = recordsToClear.vectors?.map((record) => record.id) ?? [];

    if (vectorsIds.length === 0) {
      return;
    }

    await index.deleteMany(vectorsIds);
  }

  private getIdForPinecone(pageId: number, chunkIndex: number) {
    return this.getPageIdPrefixForPinecone(pageId) + chunkIndex;
  }

  private getPageIdPrefixForPinecone(pageId: number) {
    return `page${pageId}#`;
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
