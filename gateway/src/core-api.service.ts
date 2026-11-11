import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export interface CoreApiResult {
  status: number;
  body: unknown;
}

type CoreHttpMethod = 'GET' | 'POST';

@Injectable()
export class CoreApiService {
  private readonly baseUrl =
    process.env.CORE_BASE_URL ?? 'http://localhost:8080';

  async forward(
    path: string,
    method: CoreHttpMethod,
    authorization?: string,
    body?: unknown,
    idempotencyKey?: string,
  ): Promise<CoreApiResult> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (authorization) {
      headers.Authorization = authorization;
    }

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    let upstream: Response;
    let text: string;

    try {
      upstream = await fetch(new URL(path, this.baseUrl), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      text = await upstream.text();
    } catch {
      throw new ServiceUnavailableException({
        code: 'CORE_UNAVAILABLE',
        message: 'Core API временно недоступен',
      });
    }

    let responseBody: unknown = null;

    if (text.length > 0) {
      try {
        responseBody = JSON.parse(text);
      } catch {
        responseBody = text;
      }
    }

    return {
      status: upstream.status,
      body: responseBody,
    };
  }
}
