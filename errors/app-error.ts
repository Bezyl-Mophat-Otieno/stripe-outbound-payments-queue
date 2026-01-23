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
