/**
 * Central security configuration helpers.
 * Fails fast in production if critical secrets are missing.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable must be set in production.');
    }
    return 'vagrova_local_dev_only_jwt_secret_do_not_use_in_prod';
  }
  return secret;
}
