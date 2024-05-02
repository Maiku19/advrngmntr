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
        logInfo(
            `[DeviceEvent: START] \n
                EventId: ${event.ding.id}\n
                LocationId: ${event.ding.location_id}\n
                DeviceName: ${event.ding.device_name}\n
                MotionType: ${event.ding.detection_type}\n
                HumanDetected: ${event.ding.human_detected}\n
                Subtype: ${event.subtype}\n
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
        logInfo(`[DoorbellPress: START]\n
          EventId: ${event.ding.id}\n  
          DoorbellId: ${doorbell.id}\n
          DoorbellName: ${doorbell.name}\n
        [DoorbellPress: END]`);

        ensurePath(recordingsDir);

        const filename = `doorbellPressed_${recordingsDir}/${formatDateFs(new Date(Date.now()))}.mp4`;
        logInfo(`${doorbell.name} (${doorbell.id}) Reason: doorbell pressed | recording started (${filename})`);

        // TODO: find a way to record as long as motion is detected
        // TODO: record audio
        doorbell.recordToFile(filename, 120);
    });
}