import { RingApi, RingCamera } from "ring-client-api";
import { logInfo, logOnErr, logWarning } from "./logger";
import { existsSync, readdirSync } from "fs";
import { captureImage, webhookFile } from "./util";
import { recordingsDir } from "./consts";
import { handleOnMotionDetected } from "./handlers";

// NOTE: I probably won't add many commands, so this implementation is fine
export async function handleCommand(input: string, api: RingApi): Promise<boolean>
{
  logInfo(`[COMMAND] ${input}`);

  const cmd: string = input.trim().toLowerCase().split(" ")[0];
  const args: string[] = input.split(" ").splice(1);

  if (cmd == "exit") { return true; }
  else if (await handleCmd_dev(cmd, args, api)) { return false; }
  else if (await handleCmd_upld(cmd, args, api)) { return false; }
  else if (await handleCmd_upldall(cmd, args, api)) { return false; }
  else if (await handleCmd_rec(cmd, args, api)) { return false; }
  else if (await handleCmd_cimg(cmd, args, api)) { return false; }
  else { logWarning(`Undefined command: ${input}`); }

  return false;
}

async function handleCmd_dev(cmd: string, args: string[], api: RingApi): Promise<boolean>
{
  const cmdId = "dev";

  if (cmd != cmdId) { return false; }

  const devs = await api.getCameras();

  let out: string = "[dev: START]";
  for (const dev of devs) 
  {
    out += `  Device:\n`;
    out += `    Id: ${dev.id}\n`;
    out += `    Name: ${dev.name}\n`;
    out += `    Battery: ${dev.batteryLevel}\n`;
    out += `    Data:\n`;
    out += `      LocationId: ${dev.data.location_id}\n`;
    out += `      Description: ${dev.data.description}\n`;
    out += `      Indoor: ${dev.data.camera_location_indoor}\n`;
    out += `      IsSidewalkGateway: ${dev.data.is_sidewalk_gateway}\n`;
    out += `      MotionDetectionEnabled: ${dev.data.motion_detection_enabled}\n`;
    out += `      NightModeStatus: ${dev.data.night_mode_status}\n`;
    out += `      EnableIrLed: ${dev.data.enable_ir_led}\n`;
    out += `      CreatedAt: ${dev.data.created_at}\n`;
    out += `      DeactivatedAt: ${dev.data.deactivated_at}\n`;
  }
  out += "[dev: END]";

  logInfo(`[COMMAND_RESPONSE]:\n${out}`);

  return true;
}

async function handleCmd_upld(cmd: string, args: string[], api: RingApi): Promise<boolean>
{
  const cmdId = "upld";

  if (cmd != cmdId) { return false; }
  if (args.length < 1) { logWarning(`cmd ${cmdId} takes in at least 1 argument but ${args.length} were provided`); }

  let count = 0;

  for (const arg of args)
  {
    if (!existsSync(arg))
    {
      logWarning(`skipping ${arg}. Reason: File does not exist`);
      continue;
    }

    try
    {
      await logOnErr(async () =>
      {
        await webhookFile(arg); // NOTE: might get rate limited
      });
    }
    catch (error) 
    {
      logWarning(`Failed to upload ${arg}`);
      continue;
    }

    logInfo(`Uploaded ${arg} successfully`);
    count++;
  }

  logInfo(`[COMMAND_RESPONSE]: Successfully uploaded ${count} files`);

  return true;
}

async function handleCmd_upldall(cmd: string, args: string[], api: RingApi): Promise<boolean>
{
  const cmdId = "upldall";

  if (cmd != cmdId) { return false; }
  if (args.length > 1) { logWarning(`omitting arguments as cmd ${cmdId} takes in 0, ${args.length} were provided`); }

  let count = 0;

  const dir = readdirSync(recordingsDir);
  for (const file of dir)
  {
    logInfo(file);
    try
    {
      await logOnErr(async () =>
      {
        await webhookFile(`${recordingsDir}/${file}`); // NOTE: might get rate limited
      });
    }
    catch (error) 
    {
      logWarning(`Failed to upload ${file}`);
      continue;
    }

    logInfo(`Uploaded ${file} successfully`);
    count++;
  }

  logInfo(`[COMMAND_RESPONSE]: Successfully uploaded ${count} files`);


  return true;
}

async function handleCmd_rec(cmd: string, args: string[], api: RingApi): Promise<boolean>
{
  const cmdId = "rec";

  if (cmd != cmdId) { return false; }
  if (args.length < 1) { logWarning(`cmd ${cmdId} takes in at least 1 argument but ${args.length} were provided`); }
  if (args.length > 1) { logWarning(`omitting arguments as cmd ${cmdId} takes in 1, ${args.length} were provided`); }

  logInfo("Fetching cameras");
  const cams = await api.getCameras();
  for (const cam of cams)
  {
    if (!getFlag("a", "all", args) && cam.id.toString() != args[0]) { continue; }
    logInfo("Invoking record");
    handleOnMotionDetected(cam, getFlag("u", "upload-to-webhook", args));
  }

  return true;
}

async function handleCmd_cimg(cmd: string, args: string[], api: RingApi): Promise<boolean>
{
  const cmdId = "cimg";

  if (cmd != cmdId) { return false; }
  if (args.length < 1) { logWarning(`cmd ${cmdId} takes in at least 1 argument but ${args.length} were provided`); }
  if (args.length > 2) { logWarning(`omitting arguments as cmd ${cmdId} takes in 1-2, ${args.length} were provided`); }

  const cams = await api.getCameras();
  for (const cam of cams)
  {
    if (!getFlag("a", "all", args) && cam.id.toString() != args[0]) { continue; }
    captureImage(cam, "unknown", getFlag("u", "upload-to-webhook", args));
  }

  return true;
}


// -- cmd arg helper functions --


function isPresent(arg: string, args: string[]): boolean
{
  for (const argument of args) 
  {
    const argStr = argument as string;
    if (argStr.startsWith("--")) { continue; }
    if (!argStr.startsWith("-")) { continue; }

    if (!argStr.includes(arg)) { continue; }

    return true;
  }

  return false;
}

function isPresentFull(longArg: string, args: string[]) 
{
  for (const argument of args) 
  {
    if (!(argument as string).startsWith(`--${longArg}`)) { continue; }

    return true;
  }

  return false;
}

export function getFlag(flag: string, flagLong: string, args: string[]): boolean
{
  return getFlagShort(flag, args) || getFlagFull(flagLong, args);
}

export function getFlagShort(flag: string, args: string[]): boolean
{
  return isPresent(flag, args);
}

export function getFlagFull(longFlag: string, args: string[]): boolean
{
  return isPresentFull(longFlag, args);
}