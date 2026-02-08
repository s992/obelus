import { z } from "zod";

export const authSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Email must be a valid email address."),
  password: z
    .string()
    .min(1, "Password is required.")
    .min(8, "Password must be at least 8 characters."),
  displayName: z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }, z.string().min(1).optional()),
});

const optionalNumberField = (minimum: number, maximum: number) =>
  z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    return Number(value);
  }, z.number().min(minimum).max(maximum).optional());

export const readingSchema = z.object({
  startedAt: z.string().min(1, "Start date is required."),
  finishedAt: z.string().optional(),
  progressPercent: optionalNumberField(0, 100),
  judgment: z.enum(["Accepted", "Rejected"]).optional(),
  notes: z.string().optional(),
});

export const toReadSchema = z.object({
  priority: optionalNumberField(1, 5),
  notes: z.string().optional(),
});

export const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required.").max(120, "Display name is too long."),
  collectionVisibility: z.enum(["private", "public"]),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password must be at least 8 characters."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New password and confirmation must match.",
    path: ["confirmPassword"],
  });

export type AuthInput = z.infer<typeof authSchema>;
export type ReadingInput = z.infer<typeof readingSchema>;
export type ToReadInput = z.infer<typeof toReadSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
export type ReadingTab = "currently-reading" | "planned" | "finished";
