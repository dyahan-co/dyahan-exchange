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
  ): Promise<CoreApiResult> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (authorization) {
      headers.Authorization = authorization;
    }

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    let upstream: Response;

    try {
      upstream = await fetch(new URL(path, this.baseUrl), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ServiceUnavailableException({
        code: 'CORE_UNAVAILABLE',
        message: 'Core API временно недоступен',
      });
    }

    const text = await upstream.text();
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