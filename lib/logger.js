export const logger = {
  log: (...args) => console.log(...args),
  warn: (...args) => console.warn('AIS (warn):', ...args),
  error: (...args) => console.error('AIS (error):', ...args),
}
