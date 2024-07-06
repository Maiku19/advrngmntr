import "dotenv/config";
import { Location, RingApi } from "ring-client-api";
import { handleDeviceEvent, handleLocationConnect, handleOnDoorbellPressed, handleOnMotionDetected, handleRefreshTokenUpdate } from "./handlers";
import { logOnFatalErr, init as loggerInit, logInfo, archiveLog } from "./logger";
import * as readline from "readline";
import { handleCommand } from "./command-handler";

// im actually enjoying the TS syntax, considering it's just JS with types :P

// START OF PROGRAM
loggerInit();
logInfo("[PROGRAM: START]");

try
{
  logInfo("Staring API");
  const ringApi = new RingApi
    ({
      refreshToken: process.env.RING_REFRESH_TOKEN!,
    });

  logOnFatalErr(() => setup(ringApi, () =>
  {
    logInfo("[Setup: EXIT]");

    promptCmd(ringApi); // <- END OF PROGRAM
  }));
}
catch (error)
{
  logInfo(`Terminating due to fatal error: ${error}`);
  archiveLog();
  logInfo("[PROGRAM: TERMINATE]");
  process.exit(-1);
}


async function setup(ringApi: RingApi, callback?: () => void) 
{
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

  logInfo("Subscribing to camera.onDoorbellPressed");
  for (const camera of allCameras)
  {
    camera.onDoorbellPressed.subscribe((event) => handleOnDoorbellPressed(camera, event));
  }

  logInfo("[LISTEN: START]");

  if (callback != null) { callback(); }
}

// imma just use recursion cuz idk how to get a sync version on readline ToT
async function promptCmd(ringApi: RingApi, rl?: readline.Interface,)
{
  rl ??= readline.createInterface
    ({
      input: process.stdin,
      output: process.stdout
    });

  // will this ever cause a stack overflow? Probably not, but still in the future I'd like a non-recursive version X-X
  rl.question("cmd>", async (answer) => { if (await handleCommand(answer, ringApi)) { logInfo("Archiving Log"); archiveLog(); logInfo("[PROGRAM: END]"); process.exit(0); } promptCmd(ringApi, rl); });
  // END OF PROGRAM
}

async function logDevices(locations: Location[]) 
{
  logInfo("[logDevices: START]");

  for (const location of locations)
  {
    const cameras = location.cameras;
    const devices = await location.getDevices();

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