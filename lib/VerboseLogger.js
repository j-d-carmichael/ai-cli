export class VerboseLogger {
  static isVerbose = false;

  static setIsVerbose (on) {
    if (on) {
      console.log('Setting verbose logging to ON');
    }
    VerboseLogger.isVerbose = on;
  }

  static log (from, payloadToLog) {
    if (!VerboseLogger.isVerbose) {
      return;
    }
    console.log(`

_________ START: VERBOSE LOG _________ 

${JSON.stringify(payloadToLog, null, 4)}

_________ END: VERBOSE LOG _________

`);
  }
}
