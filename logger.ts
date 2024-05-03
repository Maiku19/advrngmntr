import fs from "fs";
import { latestLog, logDir, oldLogDir } from "./consts";
import { ensurePath, formatDate, formatDateFs } from "./util";

// probably should've put this in a class instead of making everything a function ¯\_(OwO)_/¯

let isInit: boolean = false;

export enum LogLevel
{
  INFO,
  WARNING,
  ERROR,
  FATAL_ERROR
}

function initCheck()
{
  if (!isInit) { init(); }
}

export function init()
{
  if (isInit) { throw new Error("logger is already initialized!"); }
  isInit = true;

  ensurePath(logDir);

  if (fs.existsSync(latestLog))
  {
    ensurePath(oldLogDir);
    fs.renameSync(latestLog, `${oldLogDir}/${formatDateFs(new Date(Date.now()))}.log`);
  }

  log_internal("Logger start", LogLevel.INFO);
}

export function logInfo(msg: string)
{
  log(msg, LogLevel.INFO);
}

export function logWarning(msg: string)
{
  log(msg, LogLevel.WARNING);
}

export function logError(msg: string)
{
  log(msg, LogLevel.ERROR);
}

export function logFatalError(msg: string)
{
  log(msg, LogLevel.ERROR);
}

export function log(msg: string, logLevel: LogLevel)
{
  initCheck();

  log_internal(msg, logLevel);
}

function log_internal(msg: string, logLevel: LogLevel)
{
  const logOutput = `[${formatDate(new Date(Date.now()))}][${LogLevel[logLevel]}] ${msg}\n`;

  fs.appendFileSync(latestLog, logOutput);

  // idk if i like this or not
  const logFunction =
    logLevel == LogLevel.INFO ? console.log :
      logLevel == LogLevel.WARNING ? console.warn :
        console.error;

  logFunction(logOutput);
}

// I hope I did this correctly OmO
export function logOnErr<T>(call: (...args: any) => T): T
{
  try
  {
    return call();
  }
  catch (err)
  {
    // hot af
    let msg: string = err instanceof Error ? `${(err as Error).message} at: ${(err as Error).stack}` : err instanceof String ? err as string : "Unknown Error";
    logError(msg);

    throw err;
  }
}

export function logOnFatalErr<T>(call: (...args: any) => T): T
{
  try
  {
    return call();
  }
  catch (err)
  {
    // hot af
    let msg: string = err instanceof Error ? `${(err as Error).message} at: ${(err as Error).stack}` : err instanceof String ? err as string : "Unknown Error";
    logError(msg);

    throw err;
  }
}

export function archiveLog()
{
  ensurePath(logDir);

  if (fs.existsSync(latestLog))
  {
    ensurePath(oldLogDir);
    fs.renameSync(latestLog, `${oldLogDir}/${formatDateFs(new Date(Date.now()))}.log`);
  }
}