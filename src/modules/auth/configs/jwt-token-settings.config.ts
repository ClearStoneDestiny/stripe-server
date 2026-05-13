import {
  ACCESS_TOKEN_LIFETIME_MS,
  REFRESH_TOKEN_LIFETIME_MS,
} from '@auth/constants/jwt-tokens.constant';

export const JWT_TOKEN_SETTINGS = {
  ACCESS_TOKEN: {
    name: 'accessToken',
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      maxAge: ACCESS_TOKEN_LIFETIME_MS, 
    },
  },
  REFRESH_TOKEN: {
    name: 'refreshToken',
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      maxAge: REFRESH_TOKEN_LIFETIME_MS,
    },
  },
};
