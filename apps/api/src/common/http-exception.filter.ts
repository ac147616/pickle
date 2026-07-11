import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorBody {
  code: string;
  message: string;
}

// CLAUDE.md: "Errors: typed error responses { code, message }; never leak
// stack traces or SQL." Nest's default HttpException body is
// { statusCode, message, error } - this normalizes every response (thrown
// or uncaught) to exactly { code, message }.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(toErrorBody(exception));
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    } satisfies ErrorBody);
  }
}

function toErrorBody(exception: HttpException): ErrorBody {
  const body = exception.getResponse();
  if (
    typeof body === 'object' &&
    body !== null &&
    'code' in body &&
    'message' in body
  ) {
    const { code, message } = body as Record<string, unknown>;
    if (typeof code === 'string' && typeof message === 'string') {
      return { code, message };
    }
  }
  return { code: exception.name, message: exception.message };
}
