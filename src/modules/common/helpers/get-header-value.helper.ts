import { IncomingHttpHeaders } from 'http';

export const getHeaderValue = (
  headers: IncomingHttpHeaders,
  key: string,
): string | undefined => {
  const value = headers?.[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};
