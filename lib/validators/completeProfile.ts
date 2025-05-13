import { z } from "zod";

export const completeProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username can't be more than 20 characters."),
  name: z
    .string()
    .min(2, "Name is required.")
    .max(50, "Name can't be more than 50 characters."),
  avatar: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  bio: z
    .string()
    .max(50, "Bio can't be more than 50 characters.")
    .optional()
    .or(z.literal("")),
});

export type CompleteProfileValues = z.infer<typeof completeProfileSchema>;
