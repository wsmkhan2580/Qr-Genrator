import { describe, it, expect } from '@jest/globals';
import { assertProductionSecrets } from '../../src/config/secrets.js';

const good = 'a'.repeat(16) + 'B'.repeat(16) + '1234567890';
const other = 'z'.repeat(16) + 'Y'.repeat(16) + '0987654321';

describe('assertProductionSecrets', () => {
  it('accepts two distinct long secrets', () => {
    expect(() => assertProductionSecrets({ jwtSecret: good, ticketTokenSecret: other })).not.toThrow();
  });

  it('rejects a missing ticket token secret', () => {
    expect(() => assertProductionSecrets({ jwtSecret: good, ticketTokenSecret: '' })).toThrow(/TICKET_TOKEN_SECRET/);
  });

  it('rejects short secrets', () => {
    expect(() => assertProductionSecrets({ jwtSecret: 'short', ticketTokenSecret: other })).toThrow(/at least 32/);
  });

  it('rejects the .env.example placeholders', () => {
    expect(() =>
      assertProductionSecrets({
        jwtSecret: 'replace-this-with-a-long-random-string-min-32-chars',
        ticketTokenSecret: other,
      })
    ).toThrow(/placeholder/);
  });

  it('rejects reusing one secret for both purposes', () => {
    expect(() => assertProductionSecrets({ jwtSecret: good, ticketTokenSecret: good })).toThrow(/different/);
  });
});
