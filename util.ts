import { existsSync, mkdirSync } from "fs";

export function formatDate(date: Date): string
{
  return `${date.getUTCFullYear()}-${date.getUTCMonth().toString().padStart(2, "0")}-${date.getUTCDay().toString().padStart(2, "0")} ${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}:${date.getUTCSeconds().toString().padStart(2, "0")}`;
}

export function formatDateFs(date: Date): string
{
  // fuck windows
  return `${date.getUTCFullYear()}-${date.getUTCMonth().toString().padStart(2, "0")}-${date.getUTCDay().toString().padStart(2, "0")} ${date.getUTCHours().toString().padStart(2, "0")}${date.getUTCMinutes().toString().padStart(2, "0")}${date.getUTCSeconds().toString().padStart(2, "0")}`;
}

export function ensurePath(path: string)
{
  if (!existsSync(path)) { mkdirSync(path); }
}