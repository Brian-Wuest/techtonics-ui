import { InjectionToken } from '@angular/core';

// A generic token to hold any custom plug-in wrappers

export interface LoaderExtensionConfig {
  /** A lifecycle hook that passes tracking functions to external wrappers */
  onInitialize: (show: () => void, hide: () => void) => void;
}

export const LOADER_EXTENSIONS = new InjectionToken<LoaderExtensionConfig[]>('LOADER_EXTENSIONS', {
  providedIn: 'root',
  factory: () => [], // Defaults to no extensions
});
