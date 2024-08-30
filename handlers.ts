import { readFile, writeFile } from "fs";
import { promisify } from "util";
import { logOnErr, logInfo } from "./logger";
import { Location, PushNotificationDing, RingCamera } from "ring-client-api";
import { captureImage, record } from "./util";

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
    const status = connected ? "Connected to" : "Disconnected from";
    logInfo(`${status} location ${location.name} (${location.id})`);
}

export async function handleDeviceEvent(device: RingCamera, event: PushNotificationDing) 
{
    logOnErr(async () =>
    {
        logInfo(
`\n[DeviceEvent: START]
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
        if (!value) { return; }

        captureImage(camera, "motion");
        record(camera, "motion", 30);
    });
}

export async function handleOnDoorbellPressed(doorbell: RingCamera, event: PushNotificationDing)
{
    logOnErr(async () =>
    {
        logInfo(
`\n[handleOnDoorbellPressed: START]
  EventId: ${event.ding.id}
  DoorbellId: ${doorbell.id}
  DoorbellName: ${doorbell.name}
[handleOnDoorbellPressed: END]`
        );

        captureImage(doorbell, "doorbellPressed");
        record(doorbell, "doorbellPressed", 120);
    });
}