import type { FileAttachment } from '@/types/dashboard.types';

export interface QueuedMessage {
  id: string;
  content: string;
  attachment?: FileAttachment | null;
  timestamp: number;
  retries: number;
}

type RetryHandler = (message: QueuedMessage) => Promise<boolean>;

class OfflineMessageQueue {
  private queue: QueuedMessage[] = [];
  private isProcessing = false;
  private onRetry: RetryHandler | null = null;

  constructor() {
    this.loadFromStorage();
  }

  setRetryHandler(handler: RetryHandler) {
    this.onRetry = handler;
  }

  add(content: string, attachment?: FileAttachment | null): string {
    const id = crypto.randomUUID();
    this.queue.push({ id, content, attachment, timestamp: Date.now(), retries: 0 });
    this.saveToStorage();
    return id;
  }

  remove(id: string) {
    this.queue = this.queue.filter(m => m.id !== id);
    this.saveToStorage();
  }

  getAll(): QueuedMessage[] {
    return [...this.queue];
  }

  get length(): number {
    return this.queue.length;
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.onRetry || this.queue.length === 0) return;
    this.isProcessing = true;

    for (const message of [...this.queue]) {
      if (message.retries >= 3) {
        this.remove(message.id);
        continue;
      }

      try {
        const success = await this.onRetry(message);
        if (success) {
          this.remove(message.id);
        } else {
          message.retries++;
          this.saveToStorage();
        }
      } catch {
        message.retries++;
        this.saveToStorage();
      }
    }

    this.isProcessing = false;
  }

  private saveToStorage() {
    try {
      sessionStorage.setItem('ayn-offline-queue', JSON.stringify(this.queue));
    } catch {
      // Storage full or unavailable
    }
  }

  private loadFromStorage() {
    try {
      const stored = sessionStorage.getItem('ayn-offline-queue');
      if (stored) this.queue = JSON.parse(stored);
    } catch {
      // Parse error
    }
  }
}

export const offlineQueue = new OfflineMessageQueue();
