import { readFile, writeFile } from "fs";
import { promisify } from "util";
import { logOnErr, logInfo } from "./logger";
import { Location, NotificationDetectionType, PushNotificationDing, RingCamera } from "ring-client-api";
import { recordingsDir } from "./consts";
import { existsSync, mkdirSync } from "fs";
import { ensurePath } from "./util";

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

        if (event.ding.detection_type == NotificationDetectionType.Motion)
        {
            onCameraDetectMotion(device);
        }

        const eventString =
            event.ding.detection_type === "motion"
                ? "Motion detected"
                : event.subtype === "ding"
                    ? "Doorbell pressed"
                    : `Video started (${event.subtype})`;

        logInfo(
            `${event.ding.device_name} ${eventString}. Ding id: ${event.ding.id}`
        );
    });
}

async function onCameraDetectMotion(camera: RingCamera)
{
    ensurePath(recordingsDir);

    const filename = `${recordingsDir}/${new Date().getUTCSeconds()}.mp4`;
    logInfo(`${camera.name} (${camera.id}): recording started (${filename})`);

    camera.recordToFile(filename, 30);
}