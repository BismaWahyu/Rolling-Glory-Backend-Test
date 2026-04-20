import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = exception instanceof HttpException ? exception.getResponse() : null;
    const title =
      exception instanceof HttpException ? exception.name : 'InternalServerError';

    let detail: string | string[] = 'An unexpected error occurred';
    if (responseBody) {
      if (typeof responseBody === 'string') {
        detail = responseBody;
      } else if (typeof responseBody === 'object' && 'message' in responseBody) {
        detail = (responseBody as { message: string | string[] }).message;
      }
    } else if (exception instanceof Error) {
      detail = exception.message;
      this.logger.error(exception.stack);
    }

    response.status(status).json({
      errors: [
        {
          status: String(status),
          title,
          detail,
          source: { pointer: request.url },
        },
      ],
    });
  }
}
