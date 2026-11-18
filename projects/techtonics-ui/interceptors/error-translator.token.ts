import { HttpErrorResponse } from '@angular/common/http';
import { InjectionToken } from '@angular/core';

export interface HttpErrorTranslator {
  translate(status: number, defaultMessage: string, serverMessage?: string, serverError?: HttpErrorResponse): string;
}

export const HTTP_ERROR_TRANSLATOR = new InjectionToken<HttpErrorTranslator>('VALIDATION_TRANSLATOR', {
  providedIn: 'root',
  // Use the fallback translator service if none was provided.
  factory: () => {
    // Create a default implementation that just returns the default message.
    return {
      translate: (status: number, defaultMessage: string, serverMessage?: string, serverError?: HttpErrorResponse) => {
        return defaultMessage;
      },
    };
  },
});
