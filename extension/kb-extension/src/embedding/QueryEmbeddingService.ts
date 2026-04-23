import * as fs from 'fs';
import * as path from 'path';
import type { KBExtensionConfig } from '../types';

export interface QueryEmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  modelName: string;
}

type FeatureExtractionPipeline = (
  input: string,
  options?: Record<string, unknown>
) => Promise<{ data: ArrayLike<number> }>;

const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434';
const DEFAULT_LM_STUDIO_URL = 'http://127.0.0.1:1234';

class TransformersQueryEmbeddingService implements QueryEmbeddingService {
  readonly modelName: string;
  private extractorPromise: Promise<FeatureExtractionPipeline> | null = null;
  private cache = new Map<string, number[]>();
  private cacheEnabled: boolean;

  constructor(modelName: string, cacheEnabled: boolean) {
    this.modelName = modelName;
    this.cacheEnabled = cacheEnabled;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const normalized = text.trim();
    if (this.cacheEnabled) {
      const cached = this.cache.get(normalized);
      if (cached) {
        return cached;
      }
    }

    const extractor = await this.getExtractor();
    const output = await extractor(normalized, {
      pooling: 'mean',
      normalize: true,
    });
    const embedding = Array.from(output.data, (value) => Number(value));

    if (this.cacheEnabled) {
      this.cache.set(normalized, embedding);
    }

    return embedding;
  }

  private async getExtractor(): Promise<FeatureExtractionPipeline> {
    if (!this.extractorPromise) {
      this.extractorPromise = (async () => {
        const transformersModule = await import('@xenova/transformers');
        this.configureBundledModelRuntime(transformersModule);
        const extractor = await transformersModule.pipeline('feature-extraction', this.modelName);
        return extractor as FeatureExtractionPipeline;
      })();
    }

    return this.extractorPromise;
  }

  private configureBundledModelRuntime(transformersModule: {
    env: {
      localModelPath: string;
      allowRemoteModels: boolean;
      allowLocalModels: boolean;
      useFSCache: boolean;
    };
  }): void {
    const modelConfigPath = path.join(
      transformersModule.env.localModelPath,
      this.modelName,
      'config.json'
    );

    if (!fs.existsSync(modelConfigPath)) {
      return;
    }

    transformersModule.env.allowLocalModels = true;
    transformersModule.env.allowRemoteModels = false;
    transformersModule.env.useFSCache = false;
  }
}

class OllamaQueryEmbeddingService implements QueryEmbeddingService {
  readonly modelName: string;
  private endpoint: string;

  constructor(modelName: string, endpoint = DEFAULT_OLLAMA_URL) {
    this.modelName = modelName;
    this.endpoint = endpoint.replace(/\/$/, '');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const input = text.trim();
    const embedResponse = await fetch(`${this.endpoint}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.modelName, input }),
    });

    if (embedResponse.ok) {
      const embedData = (await embedResponse.json()) as { embeddings?: number[][] };
      const embedding = embedData.embeddings?.[0];
      if (embedding) {
        return embedding;
      }
    }

    const legacyResponse = await fetch(`${this.endpoint}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.modelName, prompt: input }),
    });

    if (!legacyResponse.ok) {
      throw new Error(`Ollama embedding request failed with status ${legacyResponse.status}`);
    }

    const legacyData = (await legacyResponse.json()) as { embedding?: number[] };
    if (!legacyData.embedding) {
      throw new Error('Ollama embedding response did not include an embedding vector');
    }

    return legacyData.embedding;
  }
}

class LMStudioQueryEmbeddingService implements QueryEmbeddingService {
  readonly modelName: string;
  private endpoint: string;

  constructor(modelName: string, endpoint = DEFAULT_LM_STUDIO_URL) {
    this.modelName = modelName;
    this.endpoint = endpoint.replace(/\/$/, '');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`${this.endpoint}/v1/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.modelName,
        input: text.trim(),
      }),
    });

    if (!response.ok) {
      throw new Error(`LM Studio embedding request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: Array<{ embedding?: number[] }>;
    };
    const embedding = payload.data?.[0]?.embedding;
    if (!embedding) {
      throw new Error('LM Studio embedding response did not include an embedding vector');
    }

    return embedding;
  }
}

export async function createQueryEmbeddingService(
  config: KBExtensionConfig
): Promise<QueryEmbeddingService | undefined> {
  switch (config.embedding.provider) {
    case 'none':
      return undefined;
    case 'ollama':
      return new OllamaQueryEmbeddingService(
        config.embedding.model,
        process.env.KB_OLLAMA_URL || DEFAULT_OLLAMA_URL
      );
    case 'lm-studio':
      return new LMStudioQueryEmbeddingService(
        config.embedding.model,
        process.env.KB_LM_STUDIO_URL || DEFAULT_LM_STUDIO_URL
      );
    case 'transformers':
    default:
      return new TransformersQueryEmbeddingService(
        config.embedding.model,
        config.embedding.cacheEmbeddings
      );
  }
}