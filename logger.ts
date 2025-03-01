import fs, { utimes } from "fs";
import { latestLog, logDir, oldLogDir } from "./consts";
import { webhookMessage, ensurePath, formatDate, formatDateFs, webhookMessage_internal } from "./util";

// probably should've put this in a class instead of making everything a function ¯\_(OwO)_/¯

let isInit: boolean = false;
let logUrl: string | null;

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


export function init(webhookUrl: string | null = null)
{
  if (isInit) { throw new Error("logger is already initialized!"); }
  isInit = true;

  logUrl = webhookUrl;
  archiveLog();

  log_internal("Logger start", LogLevel.INFO);
}

export function logInfo(msg: string, sendToWebhook: boolean = true)
{
  log(msg, LogLevel.INFO, sendToWebhook);
}

export function logWarning(msg: string, sendToWebhook: boolean = true)
{
  log(msg, LogLevel.WARNING, sendToWebhook);
}

export function logError(msg: string, sendToWebhook: boolean = true)
{
  log(msg, LogLevel.ERROR, sendToWebhook);
}

export function logFatalError(msg: string, sendToWebhook: boolean = true)
{
  log(msg, LogLevel.ERROR, sendToWebhook);
}

export function log(msg: string, logLevel: LogLevel, sendToWebhook: boolean = true)
{
  initCheck();

  log_internal(msg, logLevel, sendToWebhook);
}

function log_internal(msg: string, logLevel: LogLevel, sendToWebhook: boolean = true)
{
  const logOutput = `[${formatDate(new Date())}][${LogLevel[logLevel]}] ${msg}`;

  fs.appendFileSync(latestLog, logOutput + '\n');

  try 
  {
    if (sendToWebhook && logUrl != null)
    {
      webhookMessage_internal(logOutput, logUrl);
    }
  }
  catch (error)
  {
    logError(`Failed to send log message to webhook! Error: ${error}`);
  }

  // idk if i like this or not
  const logFunction =
    logLevel == LogLevel.INFO ?     console.log :
    logLevel == LogLevel.WARNING ?  console.warn :
                                    console.error;

  logFunction(logOutput);
}

// This doesn't work T^T
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
    fs.renameSync(latestLog, `${oldLogDir}/${formatDateFs(new Date())}.log`);
  }
}