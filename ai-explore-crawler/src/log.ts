function log(...messages: (string | number)[]) {
  console.log(`[${new Date().toISOString()}] ${messages.join(' ')}`);
}

export { log };
