import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public so a globally-applied JwtAccessGuard can skip it.
 * Usage: @Public() on a handler or controller class.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
