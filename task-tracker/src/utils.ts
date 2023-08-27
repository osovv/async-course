export const getRandomElement = <T extends unknown>(array: T[]) =>
  array[Math.floor(Math.random() * array.length)];
