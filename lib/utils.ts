import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function encodeEmailToSecret(email: string): string {
  const encodedEmail = Buffer.from(email, 'utf-8').toString('base64');
  return `V${encodedEmail}D`;
}

export function decodeSecretToEmail(secret: string): string {
  const encodedEmail = secret.slice(1, -1);
  return Buffer.from(encodedEmail, 'base64').toString('utf-8');
}
