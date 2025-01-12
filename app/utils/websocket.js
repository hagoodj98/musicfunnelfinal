const isBrowser = typeof window !== "undefined";

// Create WebSocket connection only if in the browser
export const wsInstance = isBrowser ? new WebSocket('ws://localhost:8080') : null;