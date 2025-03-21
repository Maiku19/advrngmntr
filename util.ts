import { existsSync, mkdirSync, rmSync } from "fs";
import { Webhook } from "discord-webhook-node";
import { logError, logInfo, logOnErr } from "./logger";
import { RingCamera } from "ring-client-api";
import { recordingsDir } from "./consts";
import "fluent-ffmpeg"
import Ffmpeg from "fluent-ffmpeg";

export function formatDate(date: Date): string
{
  return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}-${date.getUTCDate().toString().padStart(2, "0")} ${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}:${date.getUTCSeconds().toString().padStart(2, "0")}`;
}

export function formatDateFs(date: Date): string
{
  // fuck windows
  return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}-${date.getUTCDate().toString().padStart(2, "0")}_${date.getUTCHours().toString().padStart(2, "0")}${date.getUTCMinutes().toString().padStart(2, "0")}${date.getUTCSeconds().toString().padStart(2, "0")}`;
}

export function ensurePath(path: string)
{
  if (!existsSync(path)) { mkdirSync(path); }
}

function createWebhook(webhookUrl: string = process.env.DISCORD_WEBHOOK_URL!): Webhook
{
  logInfo("[WEBHOOK_SEND: START]", false);
  const hook = new Webhook(webhookUrl);

  hook.setUsername("Advanced (not) Ring Monitor");
  hook.setAvatar("https://yt3.googleusercontent.com/ytc/AIdro_leYAV1c0jVxt2bzEhB3lmqym1uUz15WybpwDufaZ9w7M8=s900-c-k-c0x00ffffff-no-rj");

  return hook;
}

export async function webhookMessage(msg: string, webhookUrl: string = process.env.DISCORD_WEBHOOK_URL!)
{
  try 
  {
    await createWebhook(webhookUrl).send(msg);
  }
  catch (error)
  {
    if (error instanceof Error)
    {
      logError(`Failed to send message via webhook! Error: ${error.name} at ${error.stack}: ${error.message}`);
      return
    }

    logError("Unknown error! Failed to send message via webhook!");
    return;
  }

  logInfo("[WEBHOOK_MSG_SEND: END]", false);
}

export async function webhookFile(path: string, webhookUrl: string = process.env.DISCORD_WEBHOOK_URL!)
{
  // try catch workaround
  try 
  {
    logOnErr(async () =>
    {
      await createWebhook(webhookUrl).sendFile(path);
    });
  }
  catch (error) 
  {
    if (error instanceof Error)
    {
      logError(`Failed to send file via webhook! Error: ${error.name} at ${error.stack}: ${error.message}`);
    }
    else
    {
      logError("Failed to send file via webhook!");
    }
  }

  logInfo("[WEBHOOK_FILE_SEND: END]");
}

export async function webhookFileWithContext(path: string, msg: string, webhookUrl: string = process.env.DISCORD_WEBHOOK_URL!)
{
  await createWebhook(webhookUrl).send(msg);
  await createWebhook(webhookUrl).sendFile(path);

  logInfo("[WEBHOOK_FILE_W_CONTEXT_SEND: END]");
}

// TODO: find a way to record as long as motion is detected
export async function record(camera: RingCamera, videoCategory: "motion" | "doorbellPressed" | "unknown", duration: number = 30, sendToWebhook: boolean = true)
{
  ensurePath(recordingsDir);

  const fname = `${videoCategory}_${formatDateFs(new Date())}.mp4`;
  const filepath = `${recordingsDir}/${fname}`;

  logInfo(`${camera.name} (${camera.id}) Reason: ${videoCategory}. Recording started (${filepath})`);

  logInfo("[RECORDING: START]");

  if (sendToWebhook) { webhookMessage(`${camera.name}: Wykryto ${videoCategory}! Rozpoczynanie nagrywania (ETA: ${duration}s)`); }
  await camera.recordToFile(filepath, duration);

  logInfo("[RECORDING: END]");

  if (sendToWebhook)
  {
    webhookFileWithContext(filepath, `${videoCategory} at ${formatDate(new Date())} UTC+00`, process.env.DISCORD_WEBHOOK_URL!);
  }
}

export async function captureImage(camera: RingCamera, category: "motion" | "doorbellPressed" | "unknown", sendToWebhook: boolean = true)
{
  ensurePath(recordingsDir);

  const fname = `${category}_${formatDateFs(new Date())}.jpg`;
  const fnameTemp = `TEMP_${formatDateFs(new Date())}.mp4`;
  const filepath = `${recordingsDir}/${fname}`;
  const filepathTemp = `${recordingsDir}/${fnameTemp}`;

  logInfo(`${camera.name} (${camera.id}) Reason: ${category}. Snap started (${filepath})`);

  logInfo("[IMG: START]");

  await camera.recordToFile(filepathTemp, 0.1);
  logInfo("[REC: COMPLETE]");

  Ffmpeg()
    .input(filepathTemp)
    .takeFrames(1)
    .saveToFile(filepath)
    .on('progress', (progress) =>
    {
      if (progress.percent)
      {
        logInfo(`ffmpeg processing: ${Math.floor(progress.percent)}% done`);
      }
    })
    .on('end', () =>
    {
      logInfo('FFmpeg has finished');
      rmSync(filepathTemp);
      logInfo("[IMG: END]");
      if (sendToWebhook)
      {
        webhookFile(filepath, process.env.DISCORD_WEBHOOK_URL!);
      }
    })
    .on('error', (error) =>
    {
      logError(`${error.name}: ${error.message} ${error.stack != null ? `\nat ${error.stack}` : ""}`);
      rmSync(filepathTemp);
      logInfo("[IMG: ERROR]");
    });
}