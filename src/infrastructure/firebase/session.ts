const DEVICE_ID_KEY = 'badcost_device_id';
const USER_NAME_KEY = 'badcost_user_name';

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function getUserName(): string | null {
  return localStorage.getItem(USER_NAME_KEY);
}

export function setUserName(name: string): void {
  localStorage.setItem(USER_NAME_KEY, name.trim());
}

export function clearUserSession(): void {
  localStorage.removeItem(USER_NAME_KEY);
}
