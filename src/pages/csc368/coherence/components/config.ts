import { CacheSize, WordsPerLine, BytesPerWord } from "./types";

/**
 * CACHE CONFIGURATION
 *
 * This file allows you to customize which cache options appear in the dropdown menus.
 * Simply comment out or remove any options you don't want to show to students.
 */

export const cacheConfig = {
  // Cache Size Options (in total words)
  cacheSizeOptions: [
    { value: CacheSize.WORDS_32, label: "32 words" },
    { value: CacheSize.WORDS_64, label: "64 words" },
    { value: CacheSize.WORDS_128, label: "128 words" },
    { value: CacheSize.WORDS_256, label: "256 words" },
    { value: CacheSize.WORDS_512, label: "512 words" },
  ],

  // Words Per Cache Line Options
  wordsPerLineOptions: [
    { value: WordsPerLine.WORDS_2, label: "2 words/line" },
    { value: WordsPerLine.WORDS_4, label: "4 words/line" },
    { value: WordsPerLine.WORDS_8, label: "8 words/line" },
    { value: WordsPerLine.WORDS_16, label: "16 words/line" },
  ],

  // Bytes Per Word Options
  bytesPerWordOptions: [
    { value: BytesPerWord.BYTES_1, label: "1 byte/word" },
    { value: BytesPerWord.BYTES_2, label: "2 bytes/word" },
    { value: BytesPerWord.BYTES_4, label: "4 bytes/word" },
    { value: BytesPerWord.BYTES_8, label: "8 bytes/word" },
  ],

  // Default Values
  defaults: {
    cacheSize: CacheSize.WORDS_64,
    wordsPerLine: WordsPerLine.WORDS_4,
    bytesPerWord: BytesPerWord.BYTES_4,
  },
};
