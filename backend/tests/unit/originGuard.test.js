import { describe, it, expect } from '@jest/globals';
import { createOriginGuard } from '../../src/middleware/originGuard.js';

const guard = createOriginGuard(['https://app.example.com']);

function run(method, origin) {
  let result = 'pending';
  guard({ method, headers: origin ? { origin } : {} }, {}, (err) => {
    result = err ? err.statusCode : 'allowed';
  });
  return result;
}

describe('originGuard (CSRF defense)', () => {
  it('allows safe methods from any origin', () => {
    expect(run('GET', 'https://evil.example')).toBe('allowed');
  });

  it('allows state-changing requests from the configured frontend', () => {
    expect(run('POST', 'https://app.example.com')).toBe('allowed');
  });

  it('blocks state-changing requests from another origin', () => {
    expect(run('POST', 'https://evil.example')).toBe(403);
    expect(run('DELETE', 'https://evil.example')).toBe(403);
    expect(run('PATCH', 'null')).toBe(403);
  });

  it('allows non-browser clients that send no Origin header', () => {
    expect(run('POST', undefined)).toBe('allowed');
  });
});
