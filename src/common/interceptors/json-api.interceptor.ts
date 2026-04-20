import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JSON_API_TYPE_KEY } from '../decorators/json-api-type.decorator';

export interface JsonApiResource<T = Record<string, unknown>> {
  type: string;
  id: string;
  attributes: T;
}

export interface JsonApiResponse {
  data: JsonApiResource | JsonApiResource[] | null;
  meta?: Record<string, unknown>;
}

interface PaginatedPayload<T> {
  items: T[];
  meta: Record<string, unknown>;
}

const isPaginated = <T>(v: unknown): v is PaginatedPayload<T> =>
  !!v && typeof v === 'object' && 'items' in (v as object) && 'meta' in (v as object);

const toResource = (type: string, entity: Record<string, unknown>): JsonApiResource => {
  const { id, ...attributes } = entity;
  return { type, id: String(id), attributes };
};

@Injectable()
export class JsonApiInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector = new Reflector()) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<JsonApiResponse> {
    const handler = context.getHandler();
    const controller = context.getClass();
    const type =
      this.reflector.get<string>(JSON_API_TYPE_KEY, handler) ||
      this.reflector.get<string>(JSON_API_TYPE_KEY, controller) ||
      'resource';

    return next.handle().pipe(
      map((payload) => {
        if (payload === null || payload === undefined) {
          return { data: null };
        }

        if (isPaginated(payload)) {
          const items = (payload.items as Record<string, unknown>[]).map((i) => toResource(type, i));
          return { data: items, meta: payload.meta };
        }

        if (Array.isArray(payload)) {
          return { data: payload.map((i) => toResource(type, i as Record<string, unknown>)) };
        }

        if (typeof payload === 'object' && 'id' in (payload as object)) {
          return { data: toResource(type, payload as Record<string, unknown>) };
        }

        return { data: null, meta: payload as Record<string, unknown> };
      }),
    );
  }
}
