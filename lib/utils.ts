import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function encodeEmailToSecret(email: string): string {
  const encodedEmail = Buffer.from(email, "utf-8").toString("base64");
  return `V${encodedEmail}D`;
}

export function decodeSecretToEmail(secret: string): string {
  const encodedEmail = secret.slice(1, -1);
  return Buffer.from(encodedEmail, "base64").toString("utf-8");
}

export function dateFormat(date: Date, formatStr: string): string {
  const pad = (n: number) => n.toString().padStart(2, "0");

  const monthsFull = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const hours12 = date.getHours() % 12 || 12;
  const ampm = date.getHours() < 12 ? "AM" : "PM";

  const map: Record<string, string> = {
    yyyy: date.getFullYear().toString(),
    MM: pad(date.getMonth() + 1),
    dd: pad(date.getDate()),
    HH: pad(date.getHours()),
    h: hours12.toString(),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
    a: ampm,
    MMMM: monthsFull[date.getMonth()],
  };

  return formatStr.replace(
    /yyyy|MMMM|MM|dd|HH|h|mm|ss|a/g,
    (match) => map[match]
  );
}

export const flattenContacts = (contacts: any[]) => {
  return contacts.map((c) => ({
    id: c.id,
    contactId: c.contactId,
    contactName: c.contactName,
    nickname: c.nickname,
    blocked: c.blocked,
    username: c.contact?.username,
    avatar: c.contact?.avatar,
    name: c.contact?.name,
    online: c.contact?.online
  }));
};

export function generateUUIDv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

export const generateAudioFileName = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `AUD-${year}${month}${day}-${hours}${minutes}${seconds}.webm`;
};
