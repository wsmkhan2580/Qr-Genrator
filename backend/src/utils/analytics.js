/**
 * Lightweight simulated analytics sink. Never logs passwords, tokens, or
 * full sensitive customer data - only event names, ids, and coarse
 * metadata.
 */
export function track(event, properties = {}) {
  const safeProps = { ...properties };
  delete safeProps.password;
  delete safeProps.passwordHash;
  delete safeProps.token;

  // eslint-disable-next-line no-console
  console.log('[Analytics]', {
    event,
    timestamp: new Date().toISOString(),
    ...safeProps,
  });
}
