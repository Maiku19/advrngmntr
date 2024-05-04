import { existsSync, mkdirSync } from "fs";
import { Webhook } from "discord-webhook-node";
import { logError, logInfo } from "./logger";
import { RingCamera } from "ring-client-api";
import { recordingsDir } from "./consts";

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

export async function webhookSend(path: string, webhookUrl: string = process.env.DISCORD_WEBHOOK_URL!, msg: string = "")
{
  // TODO: make sure to not get rate limited
  logInfo("[WEBHOOK_SEND: START]");
  const hook = new Webhook(webhookUrl);

  hook.setUsername("Advanced (not) Ring Monitor");
  hook.setAvatar("https://yt3.googleusercontent.com/ytc/AIdro_leYAV1c0jVxt2bzEhB3lmqym1uUz15WybpwDufaZ9w7M8=s900-c-k-c0x00ffffff-no-rj");

  try
  {
    if (msg != "") { await hook.send(msg); }
    await hook.sendFile(path);
  }
  catch (error) 
  {
    if (!(error instanceof Error)) { throw error; }

    logError(error.message);
    throw error;
  }

  logInfo("[WEBHOOK_SEND: END]");
}

// TODO: find a way to record as long as motion is detected
export async function SaveFile(camera: RingCamera, videoCategory: "motion" | "doorbellPressed" | "unknown", duration: number = 30, sendToWebhook: boolean = true)
{
  ensurePath(recordingsDir);

  const filename = `${videoCategory}_${formatDateFs(new Date())}.mp4`;
  const filepath = `${recordingsDir}/${filename}`;
  logInfo(`${camera.name} (${camera.id}) Reason: doorbell pressed | recording started (${filepath})`);

  await camera.recordToFile(filepath, duration);

  if (sendToWebhook)
  {
    webhookSend(filename, process.env.DISCORD_WEBHOOK_URL!, `${videoCategory} at formatDate(${new Date()}`);
  }
}