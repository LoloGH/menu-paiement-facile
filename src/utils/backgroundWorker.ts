
/**
 * A utility for handling background tasks without blocking the UI thread
 */

/**
 * Executes a task in the background using setTimeout with a minimal delay
 * to ensure it doesn't block the UI thread
 * @returns Promise that resolves with the result of the task
 */
export const runInBackground = <T>(task: () => Promise<T>, delay = 10): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
};

/**
 * Simple task queue manager to handle sequential background tasks
 */
export class TaskQueue {
  private queue: (() => Promise<any>)[] = [];
  private isProcessing = false;

  /**
   * Add a task to the queue and start processing if not already in progress
   */
  public add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });
      
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the next task in the queue
   */
  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const nextTask = this.queue.shift();

    if (nextTask) {
      try {
        await nextTask();
      } catch (error) {
        console.error("Task error:", error);
      }
    }

    // Process the next task
    this.processQueue();
  }
}

// Create a singleton instance for global use
export const globalTaskQueue = new TaskQueue();
