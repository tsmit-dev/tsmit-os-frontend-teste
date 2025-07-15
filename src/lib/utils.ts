
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { camelCase, snakeCase } from "lodash";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnakeCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result: {[key: string]: any}, key) => {
      result[snakeCase(key)] = toSnakeCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

export const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result: {[key: string]: any}, key) => {
      result[camelCase(key)] = toCamelCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
};