import { Service } from '@angular/core';

@Service()
export class UtilsService {
  /**
   * Creates a customized "debounce" function that takes in a function.
   *
   * @returns A function which can be maintained as delayed execution point for a call-back.
   */
  createCanceableAction() {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function schedule(callback: () => void, delay: number): void {
      // Cancel any previous timeout.
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Schedule the callback after a delay.
      timeoutId = setTimeout(() => {
        callback();

        // Reset after processing is complete;
        timeoutId = null;
      }, delay);
    };
  }

  /**
   * Creates a customized "debounce" function that takes in an async function.
   *
   * @returns A function which can be maintained as delayed execution point for a call-back.
   */
  createCanceableAsyncAction() {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return async function invoke(callback: () => Promise<void>, delay: number): Promise<void> {
      // Cancel any previous timeout.
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Schedule the callback.
      timeoutId = setTimeout(async () => {
        await callback();

        // Reset after processing is complete;
        timeoutId = null;
      }, delay);
    };
  }
}
