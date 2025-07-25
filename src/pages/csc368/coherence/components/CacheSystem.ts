import type { CacheConfig, CacheMetrics } from "./types";

export class CacheSystem {
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  getMetrics(): CacheMetrics {
    const totalWords = this.config.cacheSize;
    const wordsPerLine = this.config.wordsPerLine;
    const bytesPerWord = this.config.bytesPerWord;
    const totalLines = totalWords / wordsPerLine;
    const bytesPerLine = wordsPerLine * bytesPerWord;
    const totalBytes = totalWords * bytesPerWord;

    return {
      totalWords,
      totalLines,
      totalBytes,
      wordsPerLine,
      bytesPerWord,
      bytesPerLine,
    };
  }

  validateConfiguration(): boolean {
    const metrics = this.getMetrics();
    // Ensure we have a whole number of cache lines
    return Number.isInteger(metrics.totalLines) && metrics.totalLines > 0;
  }

  getFormattedSize(): string {
    const metrics = this.getMetrics();
    if (metrics.totalBytes >= 1024) {
      return `${(metrics.totalBytes / 1024).toFixed(1)} KB`;
    }
    return `${metrics.totalBytes} bytes`;
  }
}
