import { z } from "zod";

/** Mirrors CreateAnnouncementDto / UpdateAnnouncementDto */
export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Write the announcement").max(5000),
  priority: z.enum(["normal", "important", "urgent"]),
  expiresAt: z
    .string()
    .refine((v) => !v || v >= new Date().toISOString().slice(0, 10), "Expiry cannot be in the past")
    .optional(),
});

export type AnnouncementSchema = z.output<typeof announcementSchema>;
