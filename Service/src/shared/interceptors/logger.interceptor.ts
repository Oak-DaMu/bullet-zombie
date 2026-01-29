import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: Logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request: Request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;

    this.logRequest(method, url, body, headers);

    return next.handle().pipe(
      tap({
        next: (data: unknown): void => this.logResponse(data, context),
        error: (err: Error): void => this.logError(err, context),
      }),
    );
  };

  // 输出请求日志
  private logRequest(
    method: string,
    url: string,
    body: unknown,
    headers: unknown,
  ): void {
    
    this.logger.log(
      `[Request] ${method.toUpperCase()} ${url} - Body: ${JSON.stringify(
        body,
      )} - Headers: ${JSON.stringify(headers)}`,
    );
  };

  // 输出响应日志
  private logResponse(data: unknown, context: ExecutionContext): void {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const response: Response = context.switchToHttp().getResponse<Response>();

    this.logger.log(
      `Response {${response.statusCode}, ${request.method.toUpperCase()}, ${request.url
      }} ${JSON.stringify(data)}`,
    );
  };

  // 输出错误日志
  private logError(err: Error, context: ExecutionContext): void {
    const request: Request = context.switchToHttp().getRequest<Request>();

    this.logger.error(
      `[Error] ${request.method.toUpperCase()} ${request.url} - Message: ${err.message
      } - Stack: ${err.stack}`,
    );
  };

};
