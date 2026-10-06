/**
 * Production secret hygiene checks. Pure function (no process.env access)
 * so it can be unit-tested. Called from env.js only when NODE_ENV=production.
 *
 * Throws on the first problem so a misconfigured deployment fails loudly at
 * boot instead of silently running with guessable signing keys.
 */
const PLACEHOLDER_HINTS = ['replace-this', 'changeme', 'change-me', 'your-secret', 'secret123'];
const MIN_SECRET_LENGTH = 32;

function looksLikePlaceholder(value) {
  const lower = value.toLowerCase();
  return PLACEHOLDER_HINTS.some((hint) => lower.includes(hint));
}

export function assertProductionSecrets({ jwtSecret, ticketTokenSecret }) {
  const checks = [
    ['JWT_SECRET', jwtSecret],
    ['TICKET_TOKEN_SECRET', ticketTokenSecret],
  ];

  for (const [name, value] of checks) {
    if (!value) {
      throw new Error(`${name} must be set in production.`);
    }
    if (value.length < MIN_SECRET_LENGTH) {
      throw new Error(`${name} must be at least ${MIN_SECRET_LENGTH} characters in production.`);
    }
    if (looksLikePlaceholder(value)) {
      throw new Error(`${name} still looks like a placeholder value. Generate a real random secret.`);
    }
  }

  if (jwtSecret === ticketTokenSecret) {
    throw new Error('JWT_SECRET and TICKET_TOKEN_SECRET must be different values.');
  }
}
