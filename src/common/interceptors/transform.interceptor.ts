import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { MESSAGES } from '../constants/messages.constants';

export interface Response<T> {
  success: boolean;
  data: T;
  code: number;
  message: string;
}

function getStatusMessage(statusCode: number): string {
  switch (statusCode) {
    case 200:
      return MESSAGES.SUCCESS;
    case 201:
      return MESSAGES.CREATED;
    case 204:
      return MESSAGES.DELETED;
    case 400:
      return MESSAGES.BAD_REQUEST;
    case 401:
      return MESSAGES.UNAUTHORIZED;
    case 403:
      return MESSAGES.FORBIDDEN;
    case 404:
      return MESSAGES.NOT_FOUND;
    case 422:
      return MESSAGES.VALIDATION_ERROR;
    case 500:
      return MESSAGES.INTERNAL_SERVER_ERROR;
    default:
      return MESSAGES.SUCCESS;
  }
}

type SerializableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | bigint
  | SerializableValue[]
  | { [key: string]: SerializableValue };

function removeMessageFromData(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeMessageFromData);
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key !== 'message') {
        cleaned[key] = removeMessageFromData(value);
      }
    }
    return cleaned;
  }

  return obj;
}

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
  intercept(context: ExecutionContext, next: CallHandler) {
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode;
        const message = getStatusMessage(statusCode);

        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          const dataObj = data as { success: boolean; data: unknown };
          const cleanedData = removeMessageFromData(dataObj.data);
          return {
            success: dataObj.success,
            data: serializeBigInt(cleanedData as SerializableValue) as T,
            code: statusCode,
            message,
          };
        }

        const cleanedData = removeMessageFromData(data);
        const serializedData = serializeBigInt(cleanedData as SerializableValue);
        return {
          success: true,
          data: serializedData as T,
          code: statusCode,
          message,
        };
      }),
    );
  }
}
