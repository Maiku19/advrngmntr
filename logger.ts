import fs from "fs";
import { latestLog, logDir } from "./consts";
import { Expression, StructuredType, Type } from "typescript";

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

  //#region stacktrace
  // FIXME: 
  // Error: EINVAL: invalid argument, rename 'C:\Programing\TS\ring-api-test\logs\latest.log' -> 'C:\Programing\TS\ring-api-test\logs\Thu, 02 May 2024 00:02:48 GMT.log' 
  //   at Object.renameSync(node: fs: 1031: 11)
  //   at init(C: \Programing\TS\ring - api - test\jsout\logger.js: 28: 22)
  //   at initCheck(C: \Programing\TS\ring - api - test\jsout\logger.js: 20: 9)
  //   at log(C: \Programing\TS\ring - api - test\jsout\logger.js: 50: 5)
  //   at logInfo(C: \Programing\TS\ring - api - test\jsout\logger.js: 34: 5)
  //   at Object.<anonymous>(C: \Programing\TS\ring - api - test\jsout\script.js: 24: 22)
  //   at Module._compile(node: internal / modules / cjs / loader: 1376: 14)
  //   at Module._extensions..js(node: internal / modules / cjs / loader: 1435: 10)
  //   at Module.load(node: internal / modules / cjs / loader: 1207: 32)
  //   at Module._load(node: internal / modules / cjs / loader: 1023: 12) {
  //#endregion
  // if (fs.existsSync(latestLog))
  // {
  //   fs.renameSync(latestLog, `${logDir}/${new Date(Date.now()).toUTCString()}.log`);
  // }

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
  fs.appendFileSync(latestLog, `[${formatDate(new Date(Date.now()))}][${LogLevel[logLevel]}] ${msg}\n`);
  console.log(`[${formatDate(new Date(Date.now()))}][${LogLevel[logLevel]}] ${msg}`);
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

function formatDate(date: Date): string
{
  return `${date.getUTCFullYear()}-${date.getUTCMonth().toString().padStart(2, "0")}-${date.getUTCDay().toString().padStart(2, "0")} ${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}:${date.getUTCSeconds().toString().padStart(2, "0")}`;
}