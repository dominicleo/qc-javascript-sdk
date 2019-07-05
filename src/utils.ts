export const isBrowser: boolean = typeof window !== 'undefined';

export function isFunction(value: any): boolean {
  return value instanceof Function;
}

export function isPlainObject(value: any): boolean {
  if (typeof value !== 'object' || value === null) return false;

  let proto = value;

  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }

  return Object.getPrototypeOf(value) === proto;
}
