import { readFile, writeFile } from "fs";
import { promisify } from "util";
import { logOnErr, logInfo } from "./logger";
import { Location, NotificationDetectionType, PushNotificationDing, RingCamera } from "ring-client-api";
import { recordingsDir } from "./consts";
import { existsSync, mkdirSync } from "fs";
import { ensurePath, formatDateFs } from "./util";

export async function handleRefreshTokenUpdate(value: { oldRefreshToken?: string | undefined, newRefreshToken: string; }) 
{
    logOnErr(async () =>
    {
        logInfo("Refresh Token Updated");

        if (!value.oldRefreshToken) { return; }

        const currentConfig = await promisify(readFile)(".env");
        const updatedConfig = currentConfig.toString().replace(value.oldRefreshToken, value.newRefreshToken);

        await promisify(writeFile)(".env", updatedConfig);
    });
}

export async function handleLocationConnect(connected: boolean, location: Location) 
{
    // I doubt this will ever throw an error, but whatever
    logOnErr(async () =>
    {
        const status = connected ? "Connected to" : "Disconnected from";
        logInfo(`${status} location ${location.name} (${location.id})`);
    });
}

export async function handleDeviceEvent(device: RingCamera, event: PushNotificationDing) 
{
    logOnErr(async () =>
    {
        logInfo(`\n[DeviceEvent: START] 
  EventId: ${event.ding.id}
  LocationId: ${event.ding.location_id}
  DeviceName: ${event.ding.device_name}
  MotionType: ${event.ding.detection_type}
  HumanDetected: ${event.ding.human_detected}
  Subtype: ${event.subtype}
[DeviceEvent: END]`);
    });
}

export async function handleOnMotionDetected(camera: RingCamera, value: boolean)
{
    logOnErr(async () =>
    {
        if (!value)
        {
            logInfo(`${camera.name} (${camera.id}): motion: ${value}`);
            return;
        }

        ensurePath(recordingsDir);

        const filename = `motion_${recordingsDir}/${formatDateFs(new Date(Date.now()))}.mp4`;
        logInfo(`${camera.name} (${camera.id}) Reason: motion detected | recording started (${filename})`);


        // TODO: find a way to record as long as motion is detected
        // TODO: record audio
        camera.recordToFile(filename, 30);
    });
}

export async function handleOnDoorbellPressed(doorbell: RingCamera, event: PushNotificationDing)
{
    logOnErr(async () =>
    {
        logInfo(`\n[DoorbellPress: START]
  EventId: ${event.ding.id}
  DoorbellId: ${doorbell.id}
  DoorbellName: ${doorbell.name}
[DoorbellPress: END]`);

        ensurePath(recordingsDir);

        const filename = `doorbellPressed_${recordingsDir}/${formatDateFs(new Date(Date.now()))}.mp4`;
        logInfo(`${doorbell.name} (${doorbell.id}) Reason: doorbell pressed | recording started (${filename})`);

        // TODO: find a way to record as long as motion is detected
        // TODO: record audio
        doorbell.recordToFile(filename, 120);
    });
}