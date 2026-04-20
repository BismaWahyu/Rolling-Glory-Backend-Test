import { SetMetadata } from '@nestjs/common';

export const JSON_API_TYPE_KEY = 'json-api-type';
export const JsonApiType = (type: string) => SetMetadata(JSON_API_TYPE_KEY, type);
