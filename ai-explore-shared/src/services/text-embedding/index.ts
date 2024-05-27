import { EMBEDDING_MODEL_LIMIT } from '../../constants/embedding-model-limit';
import { tokenizer } from '../../utils/tokenizer';
import { Configuration, OpenAIApi } from 'openai';

class TextEmbeddingService {
  constructor(openAiApiKey: string) {
    const openAiConfiguration = new Configuration({
      apiKey: openAiApiKey,
    });

    this.openAiApi = new OpenAIApi(openAiConfiguration);
  }

  public async createEmbedding(input: string[]) {
    const response = await this.openAiApi.createEmbedding({
      input,
      model: 'text-embedding-3-small',
    });

    return response.data.data.map((data) => data.embedding);
  }

  public isInputCorrect(input: string[]) {
    return (
      input.length > 0 &&
      input.every(
        (text) =>
          text.length > 0 &&
          tokenizer.encode(text).length <= EMBEDDING_MODEL_LIMIT
      )
    );
  }

  private openAiApi: OpenAIApi;
}

export { TextEmbeddingService };
