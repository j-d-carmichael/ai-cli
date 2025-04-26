import { logger } from './logger.js';

export class VerboseLogger {
  static isVerbose = false;

  static setIsVerbose (on) {
    if (on) {
      logger.log('Setting verbose logging to ON');
    }
    VerboseLogger.isVerbose = on;
  }

  static log (from, payloadToLog) {
    if (!VerboseLogger.isVerbose) {
      return;
    }
    logger.log(`

_________ START: VERBOSE LOG _________ 

${JSON.stringify(payloadToLog, null, 4)}

_________ END: VERBOSE LOG _________

`);
  }
}
