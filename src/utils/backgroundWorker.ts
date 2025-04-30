
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
 * with configurable concurrency control and improved UI responsiveness
 */
export class TaskQueue {
  private queue: (() => Promise<any>)[] = [];
  private isProcessing = false;
  private concurrency: number;
  private activeCount = 0;
  private pauseProcessing = false;
  private lastUIUpdateTime = 0;

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
          // Improved UI responsiveness: use both requestAnimationFrame and setTimeout
          // to ensure we don't block rendering and give time for UI updates
          await new Promise(animResolve => {
            requestAnimationFrame(() => {
              setTimeout(animResolve, 0);
            });
          });
          
          // Ensure we're not running too many tasks too quickly and blocking the UI
          await this.ensureUIResponsiveness();
          
          const result = await task();
          resolve(result);
          return result;
        } catch (error) {
          console.error("Task error:", error);
          reject(error);
          throw error;
        } finally {
          this.activeCount--;
          // Allow next task to run after a brief delay to prevent UI freezing
          setTimeout(() => this.processNext(), 5);
        }
      });
      
      // Start processing immediately unless paused
      if (!this.pauseProcessing) {
        this.processNext();
      }
    });
  }

  /**
   * Process the next task in the queue if capacity is available
   */
  private processNext() {
    if (this.pauseProcessing || this.queue.length === 0 || this.activeCount >= this.concurrency) {
      if (this.queue.length === 0 && this.activeCount === 0) {
        this.isProcessing = false;
      }
      return;
    }

    this.isProcessing = true;
    this.activeCount++;
    
    const nextTask = this.queue.shift();
    if (!nextTask) return;

    // Run the task without blocking
    setTimeout(() => {
      Promise.resolve()
        .then(() => nextTask())
        .catch(error => {
          console.error("Task error:", error);
        })
        .finally(() => {
          // Check if we can process more tasks immediately
          if (this.activeCount < this.concurrency && !this.pauseProcessing) {
            this.processNext();
          }
        });
    }, 0);
  }
  
  /**
   * Ensure the UI remains responsive by adding small delays when processing many tasks
   * @private
   */
  private async ensureUIResponsiveness(): Promise<void> {
    const now = Date.now();
    // If less than 50ms since last UI update checkpoint, add a small delay
    if (now - this.lastUIUpdateTime < 50) {
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 5);
        });
      });
    }
    this.lastUIUpdateTime = Date.now();
  }
  
  /**
   * Temporarily pause processing tasks (queued tasks will remain in queue)
   */
  public pause(): void {
    this.pauseProcessing = true;
  }
  
  /**
   * Resume processing tasks
   */
  public resume(): void {
    if (this.pauseProcessing) {
      this.pauseProcessing = false;
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
  
  /**
   * Clear all pending tasks
   */
  public clear(): void {
    this.queue = [];
  }

  /**
   * Safely execute a task immediately, outside the queue but still
   * without blocking the UI thread, with improved UI responsiveness
   */
  public safeExecute<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      requestAnimationFrame(() => {
        setTimeout(async () => {
          try {
            // Ensure UI remains responsive
            await this.ensureUIResponsiveness();
            const result = await task();
            resolve(result);
          } catch (error) {
            console.error("Safe execute error:", error);
            reject(error);
          }
        }, 0);
      });
    });
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
