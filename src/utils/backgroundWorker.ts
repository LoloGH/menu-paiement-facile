
/**
 * Utilitaire pour exécuter des opérations intensives en arrière-plan
 * Utilise setTimeout avec un délai de 0ms pour ne pas bloquer le thread principal
 */

/**
 * Exécute une fonction en arrière-plan sans bloquer l'interface utilisateur
 * @param task - La fonction à exécuter en arrière-plan
 * @returns Une promesse qui se résout avec le résultat de la tâche
 */
export function runInBackground<T>(task: () => T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const result = task();
        resolve(result);
      } catch (error) {
        console.error("Error in background task:", error);
        throw error;
      }
    }, 0);
  });
}

/**
 * Exécute une fonction asynchrone en arrière-plan sans bloquer l'interface utilisateur
 * @param task - La fonction asynchrone à exécuter en arrière-plan
 * @returns Une promesse qui se résout avec le résultat de la tâche
 */
export function runAsyncInBackground<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      task()
        .then(resolve)
        .catch((error) => {
          console.error("Error in async background task:", error);
          reject(error);
        });
    }, 0);
  });
}

/**
 * Sauvegarde des données dans localStorage sans bloquer l'interface utilisateur
 * @param key - La clé localStorage
 * @param data - Les données à sauvegarder
 * @returns Une promesse qui se résout quand l'opération est terminée
 */
export function saveToLocalStorageAsync<T>(key: string, data: T): Promise<void> {
  return runInBackground(() => {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error saving data to localStorage (${key}):`, error);
    }
  });
}

/**
 * Charge des données depuis localStorage sans bloquer l'interface utilisateur
 * @param key - La clé localStorage
 * @returns Une promesse qui se résout avec les données chargées ou null
 */
export function loadFromLocalStorageAsync<T>(key: string): Promise<T | null> {
  return runInBackground(() => {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized === null) return null;
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error(`Error loading data from localStorage (${key}):`, error);
      return null;
    }
  });
}

/**
 * File d'attente simple pour exécuter des tâches séquentiellement
 */
class TaskQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  /**
   * Ajoute une tâche à la file d'attente et commence le traitement si nécessaire
   * @param task - La tâche à exécuter
   */
  enqueue(task: () => Promise<void>): void {
    this.queue.push(task);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Traite les tâches dans la file d'attente séquentiellement
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const task = this.queue.shift();

    if (task) {
      try {
        await task();
      } catch (error) {
        console.error("Error processing task in queue:", error);
      }
    }

    // Continuer avec la prochaine tâche
    this.processQueue();
  }
}

// Exporter une instance de TaskQueue pour une utilisation dans l'application
export const backgroundTaskQueue = new TaskQueue();
