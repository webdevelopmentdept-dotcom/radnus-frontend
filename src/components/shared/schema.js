import { z } from "zod";

export const insertUserSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  designation: z.string().optional(),
  department: z.string().optional(),
  password: z.string().min(6),
});
