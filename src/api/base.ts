// Coordinates base endpoints. In this local mock sandbox, we define simulated
// asynchronous delays to mimic enterprise network latency and trigger loaders correctly.
export const API_BASE_URL = 'https://api.themoviedb.org/3';
export const DELAY_MS = 250;

export const sleep = (ms: number = DELAY_MS) => new Promise((resolve) => setTimeout(resolve, ms));
