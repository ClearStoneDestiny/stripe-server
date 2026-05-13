import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const isGraphQL = host.getType<string>() === 'graphql';

    if (isGraphQL) {
      throw exception;
    }

    const response = this.getResponse(host);
    const status = this.getStatus(exception);
    const message = this.getMessage(exception);

    response.status(status).json({ message });
  }

  private getResponse(host: ArgumentsHost): Response {
    return host.switchToHttp().getResponse<Response>();
  }

  private getStatus(exception: unknown): number {
    return exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getMessage(exception: unknown): string {
    if (!(exception instanceof HttpException)) {
      return 'Something went wrong, try again later';
    }

    const response = exception.getResponse();
    return this.extractMessage(response);
  }

  private extractMessage(response: unknown): string {
    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && response !== null) {
      const { message } = response as { message?: string | string[] };
      return Array.isArray(message)
        ? message.join(', ')
        : message || 'Something went wrong';
    }

    return 'Something went wrong';
  }
}
