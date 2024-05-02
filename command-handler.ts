import { RingApi } from "ring-client-api";
import { logInfo, logWarning } from "./logger";

export async function handleCommand(input: string, api: RingApi): Promise<boolean>
{
  logInfo(`[COMMAND] ${input}`);

  const cmd: string = input.trim().toLowerCase().split(" ")[0];
  const args: string[] = input.split(" ").splice(0, 1);

  if (cmd == "exit") { return true; }
  else if (await handleCmd_dev(cmd, args, api)) { return false; }
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
};;