/**
 * Sanitize input to prevent prompt injection attacks
 */
export function sanitizeInput(input: string, maxLength: number = 200): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input');
  }

  // Trim and limit length
  let sanitized = input.trim().substring(0, maxLength);

  // Remove any potential prompt injection attempts
  // Remove common prompt injection patterns
  const dangerousPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions?/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
    /user\s*:/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<\|.*?\|>/gi, // Special tokens
    /\{.*?system.*?\}/gi,
  ];

  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  if (!sanitized) {
    throw new Error('Input contains invalid content');
  }

  return sanitized;
}

/**
 * Validate slug format (for Grokipedia scraping)
 */
export function validateSlug(slug: string): boolean {
  // Only allow alphanumeric, hyphens, underscores, and spaces
  const slugPattern = /^[a-zA-Z0-9\s_-]+$/;
  return slugPattern.test(slug) && slug.length > 0 && slug.length <= 200;
}
