/**
 * Living Registry of all supported error keys.
 */
export const SUPPORTED_VALIDATION_KEYS = [
  'required',
  'requiredtrue',
  'email',
  'pattern',
  'min',
  'max',
  'minlength',
  'maxlength',
  'passwordstrength',
  'integersonly',
  'invalidcreditcard',
  'fieldmatch',
] as const;

export type SupportedValidationKey = (typeof SUPPORTED_VALIDATION_KEYS)[number];

export interface UnifiedValidationContext {
  min?: number;
  max?: number;
  length?: number;
  actualLength?: number;
  pattern?: string;
  actualValue?: any;
  matchField?: string;
  [key: string]: any; // Catch-all for extra developer custom properties
}

/**
 * Shared Extractor Utility (No more GARY!)
 * Extracts and unifies Reactive Forms and Signal Forms metadata.
 */
export function extractAndUnifyValidationContext(
  rawContext?: Record<string, any>,
): UnifiedValidationContext {
  if (!rawContext || typeof rawContext !== 'object') return {};

  const unified: UnifiedValidationContext = {};

  // Handle Reactive Forms (.context wrapper structure)
  if (
    'context' in rawContext &&
    rawContext['context'] &&
    typeof rawContext['context'] === 'object'
  ) {
    const rx = rawContext['context'];
    unified['min'] = rx['min'];
    unified['max'] = rx['max'];
    unified['length'] = rx['requiredLength'];
    unified['pattern'] = rx['requiredPattern'];
    unified['actualLength'] = rx['actualLength'];
    unified['actualValue'] = rx['actualValue'];
    unified['matchField'] = rx['matchField'];
    return unified;
  }

  // Handle Signal Forms / Flat Structures
  unified['min'] = rawContext['min'];
  unified['max'] = rawContext['max'];
  unified['length'] = rawContext['minLength'] ?? rawContext['maxLength'];
  unified['matchField'] = rawContext['matchField'];

  if (rawContext['pattern']) {
    unified['pattern'] =
      rawContext['pattern'] instanceof RegExp
        ? rawContext['pattern'].source
        : rawContext['pattern'];
  }

  return unified;
}
