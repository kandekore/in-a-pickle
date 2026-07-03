/**
 * Minimal structured logger. The brief asks for structured logs suitable for
 * future monitoring platforms — emit JSON lines with level + timestamp.
 * TODO(platform): swap for pino/winston with transport config per environment.
 */
type Level = 'info' | 'warn' | 'error' | 'debug';

function emit(level: Level, message: string, meta?: Record<string, unknown>) {
  const line = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };
  const out = level === 'error' ? console.error : console.log;
  out(JSON.stringify(line));
}

export const logger = {
  info: (m: string, meta?: Record<string, unknown>) => emit('info', m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => emit('warn', m, meta),
  error: (m: string, meta?: Record<string, unknown>) => emit('error', m, meta),
  debug: (m: string, meta?: Record<string, unknown>) => emit('debug', m, meta),
};
