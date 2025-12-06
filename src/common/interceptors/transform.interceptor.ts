import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  code: number;
}

type SerializableValue = string | number | boolean | null | undefined | bigint | SerializableValue[] | { [key: string]: SerializableValue };

function serializeBigInt(obj: SerializableValue): SerializableValue {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }

  if (typeof obj === 'object') {
    const serialized: Record<string, SerializableValue> = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value as SerializableValue);
    }
    return serialized;
  }

  return obj;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return {
            success: (data as { success: boolean }).success,
            data: serializeBigInt((data as { data: unknown }).data as SerializableValue) as T,
            code: response.statusCode,
          };
        }
        const serializedData = serializeBigInt(data as SerializableValue);
        return {
          success: true,
          data: serializedData as T,
          code: response.statusCode,
        };
      }),
    );
  }
}
