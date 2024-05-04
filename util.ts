import { existsSync, mkdirSync } from "fs";
import { Webhook } from "discord-webhook-node";
import { logError, logInfo, logOnErr } from "./logger";
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

function createWebhook(webhookUrl: string = process.env.DISCORD_WEBHOOK_URL!): Webhook
{
  logInfo("[WEBHOOK_SEND: START]");
  const hook = new Webhook(webhookUrl);

  hook.setUsername("Advanced (not) Ring Monitor");
  hook.setAvatar("https://yt3.googleusercontent.com/ytc/AIdro_leYAV1c0jVxt2bzEhB3lmqym1uUz15WybpwDufaZ9w7M8=s900-c-k-c0x00ffffff-no-rj");

  return hook;
}

export async function webhookMessage(msg: string, webhookUrl: string = process.env.DISCORD_WEBHOOK_URL!)
{
  logOnErr(async () =>
  {
    await createWebhook(webhookUrl).send(msg);
  });

  logInfo("[WEBHOOK_MSG_SEND: END]");
}

export async function webhookFile(path: string, webhookUrl: string = process.env.DISCORD_WEBHOOK_URL!)
{
  logOnErr(async () =>
  {
    await createWebhook(webhookUrl).sendFile(path);
  });

  logInfo("[WEBHOOK_FILE_SEND: END]");
}

export async function webhookFileWithContext(path: string, msg: string, webhookUrl: string = process.env.DISCORD_WEBHOOK_URL!)
{
  logOnErr(async () => // I'm pretty sure you can do both with one hook instance but I don't feel like figuring that out .zZ
  {
    await createWebhook(webhookUrl).send(msg);
    await createWebhook(webhookUrl).sendFile(path);
  });

  logInfo("[WEBHOOK_FILE_W_CONTEXT_SEND: END]");
}

// TODO: find a way to record as long as motion is detected
export async function SaveFile(camera: RingCamera, videoCategory: "motion" | "doorbellPressed" | "unknown", duration: number = 30, sendToWebhook: boolean = true)
{
  ensurePath(recordingsDir);

  const filename = `${videoCategory}_${formatDateFs(new Date())}.mp4`;
  const filepath = `${recordingsDir}/${filename}`;

  logInfo(`${camera.name} (${camera.id}) Reason: doorbell pressed | recording started (${filepath})`);

  logInfo("[RECORDING: START]");

  if (sendToWebhook) { webhookMessage(`Wykryto ${videoCategory}! Rozpoczynanie nagrywania (ETA: ${duration}s)`); }
  await camera.recordToFile(filepath, duration);

  logInfo("[RECORDING: END]");

  if (sendToWebhook)
  {
    webhookFileWithContext(filename, `${videoCategory} at formatDate(${new Date()}`, process.env.DISCORD_WEBHOOK_URL!);
  }
}