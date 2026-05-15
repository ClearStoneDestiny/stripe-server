export const setRequestDelayInMs = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
