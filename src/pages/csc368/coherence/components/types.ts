// Cache Configuration Types
export enum CacheSize {
  WORDS_16 = 16,
  WORDS_32 = 32,
  WORDS_64 = 64,
  WORDS_128 = 128,
  WORDS_256 = 256,
  WORDS_512 = 512,
}

export enum WordsPerLine {
  WORDS_2 = 2,
  WORDS_4 = 4,
  WORDS_8 = 8,
  WORDS_16 = 16,
}

export enum BytesPerWord {
  BYTES_1 = 1,
  BYTES_2 = 2,
  BYTES_4 = 4,
  BYTES_8 = 8,
}

export interface CacheConfig {
  cacheSize: CacheSize;
  wordsPerLine: WordsPerLine;
  bytesPerWord: BytesPerWord;
}

export interface CacheMetrics {
  totalWords: number;
  totalLines: number;
  totalBytes: number;
  wordsPerLine: number;
  bytesPerWord: number;
  bytesPerLine: number;
}
