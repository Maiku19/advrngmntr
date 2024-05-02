import "dotenv/config";
import { Location, RingApi } from "ring-client-api";
import { handleDeviceEvent, handleLocationConnect, handleOnMotionDetected, handleRefreshTokenUpdate } from "./handlers";
import { logOnFatalErr, init as loggerInit, logInfo } from "./logger";
import { getFlag } from "./argutil";

// im acctualy enjoying the TS syntax, considering it's just JS with types :P
let autoRestart: boolean = getFlag("a", "auto-restart");

loggerInit();
logInfo("[PROGRAM: START]");

do
{
  try
  {
    logOnFatalErr(run);
    logInfo("[Run: EXIT]");
  }
  catch (error)
  {
    if (autoRestart) { logInfo("[PROGRAM: RESTART]"); logInfo("Restarting after fatal error"); }
    else { logInfo("Terminating after fatal error"); }
  }
} while (autoRestart);

logInfo("[PROGRAM: END]");


async function run() 
{
  const { env } = process;

  logInfo("Staring API");
  const ringApi = new RingApi
    ({
      refreshToken: env.RING_REFRESH_TOKEN!,
    });

  logInfo("Subscribing to onRefreshTokenUpdated");
  ringApi.onRefreshTokenUpdated.subscribe(handleRefreshTokenUpdate);

  logInfo("Getting locations");
  const locations = await ringApi.getLocations();
  logInfo("Getting cameras");
  const allCameras = await ringApi.getCameras();

  logInfo
    (
      `Found ${locations.length} location(s) with ${allCameras.length} camera(s).`
    );

  logInfo("Subscribing to location.onConnected");
  for (const location of locations)
  {
    location.onConnected.subscribe((connect) => handleLocationConnect(connect, location));
  }

  await logDevices(locations);

  logInfo("Subscribing to camera.onNewNotification");
  for (const camera of allCameras)
  {
    camera.onNewNotification.subscribe((event) => handleDeviceEvent(camera, event));
  }

  logInfo("Subscribing to camera.onMotionDetected");
  for (const camera of allCameras)
  {
    camera.onMotionDetected.subscribe((val) => handleOnMotionDetected(camera, val));
  }

  logInfo("[LISTEN: START]");
}

async function logDevices(locations: Location[]) 
{
  logInfo("[logDevices: START]");

  for (const location of locations)
  {
    const cameras = location.cameras,
      devices = await location.getDevices();

    logInfo(
      `${location.name} (${location.id}):`
    );

    for (const camera of cameras)
    {
      logInfo(`  ${camera.name} [${camera.id}] (${camera.deviceType})`);
    }

    for (const device of devices)
    {
      logInfo(`  ${device.zid}: ${device.name} (${device.deviceType})`);
    }
  }

  logInfo("[logDevices: END]");
}