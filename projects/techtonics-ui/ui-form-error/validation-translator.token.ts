import { InjectionToken } from '@angular/core';
import { FallbackTranslatorService } from './fallback-translator.service';

// Universal contract for any translation tool hooked by a consumer
export interface ValidationTranslator {
  translate(kind: string, context?: Record<string, any>): string;
}

/**
 * Token used by components to request a translator implementation
 */
export const VALIDATION_TRANSLATOR = new InjectionToken<ValidationTranslator>('VALIDATION_TRANSLATOR', {
  providedIn: 'root',
  // Use the fallback translator service if none was provided.
  factory: () => new FallbackTranslatorService(),
});
