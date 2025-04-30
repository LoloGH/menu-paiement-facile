
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
 * with configurable concurrency control
 */
export class TaskQueue {
  private queue: (() => Promise<any>)[] = [];
  private isProcessing = false;
  private concurrency: number;
  private activeCount = 0;

  /**
   * @param concurrency Number of concurrent tasks that can run (default: 1)
   */
  constructor(concurrency = 1) {
    this.concurrency = concurrency;
  }

  /**
   * Add a task to the queue and start processing if not already in progress
   * @returns Promise that resolves with the task result
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
        } finally {
          this.activeCount--;
          this.processNext();
        }
      });
      
      this.processNext();
    });
  }

  /**
   * Process the next task in the queue if capacity is available
   */
  private processNext() {
    if (this.queue.length === 0 || this.activeCount >= this.concurrency) {
      if (this.queue.length === 0 && this.activeCount === 0) {
        this.isProcessing = false;
      }
      return;
    }

    this.isProcessing = true;
    this.activeCount++;
    
    const nextTask = this.queue.shift();
    if (!nextTask) return;

    // Run the task without awaiting to avoid blocking
    Promise.resolve().then(async () => {
      try {
        await nextTask();
      } catch (error) {
        console.error("Task error:", error);
      }
    });
    
    // Check if we can process more tasks immediately
    if (this.activeCount < this.concurrency) {
      this.processNext();
    }
  }
  
  /**
   * Check if the queue is currently processing tasks
   */
  public get busy(): boolean {
    return this.isProcessing;
  }
  
  /**
   * Get the number of tasks waiting in the queue
   */
  public get pending(): number {
    return this.queue.length;
  }
  
  /**
   * Get the number of tasks currently executing
   */
  public get active(): number {
    return this.activeCount;
  }
}

// Create a singleton instance for global use
export const globalTaskQueue = new TaskQueue(2); // Allow 2 concurrent tasks

/**
 * Utility to retry async operations with exponential backoff
 * @param operation Function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param baseDelay Base delay between retries in ms
 */
export const withRetry = async <T>(
  operation: () => Promise<T>, 
  maxRetries = 3, 
  baseDelay = 300
): Promise<T> => {
  let retries = 0;
  
  const execute = async (): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, retries) + Math.random() * 100;
      retries++;
      
      console.log(`Operation failed, retrying (${retries}/${maxRetries}) after ${delay.toFixed(0)}ms...`);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Try again
      return execute();
    }
  };
  
  return execute();
};
