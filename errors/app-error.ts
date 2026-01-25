export interface AppErrorOptions {
  message: string;
  code: string;
  httpStatus: number;
  isOperational?: boolean;
  cause?: unknown;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  constructor({ message, code, httpStatus, cause }: AppErrorOptions) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.cause = cause;
  }
}

function isTransientError(err: Error) {
  if (!err) return false;

  const msg = err.message || '';
  const code = err.code || '';
  const status = err.status || err.response?.status;

  const transientPatterns = [
    'ECONNRESET',
    'ETIMEDOUT',
    'Rate limit',
    'Temporary failure',
    'temporarily unavailable',
    'timeout',
  ];

  const transientCodes = ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'EAI_AGAIN'];

  const transientStatuses = [408, 425, 429, 500, 502, 503, 504];

  return (
    transientPatterns.some((p) => msg.toLowerCase().includes(p.toLowerCase())) ||
    transientCodes.includes(code) ||
    transientStatuses.includes(status)
  );
}
