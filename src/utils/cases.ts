export const camelToSnakeCase = (str: string): string =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

export const snakeToCamelCase = (str: string): string =>
  str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
