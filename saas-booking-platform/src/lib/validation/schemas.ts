import { z } from "zod";

const emailSchema = z
  .string({ required_error: "This field is required" })
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254, "Email is too long");

const passwordSchema = z
  .string({ required_error: "This field is required" })
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

const nameSchema = z
  .string({ required_error: "This field is required" })
  .trim()
  .min(2, "Must be at least 2 characters")
  .max(80, "Must be at most 80 characters");

const subdomainSchema = z
  .string({ required_error: "This field is required" })
  .trim()
  .toLowerCase()
  .min(3, "Must be at least 3 characters")
  .max(30, "Must be at most 30 characters")
  .regex(
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    "Use lowercase letters, numbers and hyphens; cannot start or end with a hyphen"
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: "This field is required" })
    .min(1, "Password is required"),
  rememberMe: z.coerce.boolean().default(false),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const onboardingSchema = z
  .object({
    organizationName: nameSchema,
    subdomain: subdomainSchema,
    adminName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({ required_error: "This field is required" }),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms to continue" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const registerSchema = z
  .object({
    fullName: nameSchema,
    email: emailSchema,
    organizationSubdomain: subdomainSchema,
    password: passwordSchema,
    confirmPassword: z.string({ required_error: "This field is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z
      .string({ required_error: "This field is required" })
      .min(1, "Reset token is missing"),
    password: passwordSchema,
    confirmPassword: z.string({ required_error: "This field is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const bookingSchema = z
  .object({
    title: z
      .string({ required_error: "This field is required" })
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(120, "Title must be at most 120 characters"),
    notes: z
      .string()
      .trim()
      .max(2000, "Notes must be at most 2000 characters")
      .optional()
      .or(z.literal("")),
    startsAt: z.coerce.date({
      errorMap: () => ({ message: "Start date and time are required" }),
    }),
    endsAt: z.coerce.date({
      errorMap: () => ({ message: "End date and time are required" }),
    }),
    status: z.enum(["PENDING", "CONFIRMED"]).default("PENDING"),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: "End time must be after the start time",
    path: ["endsAt"],
  });
export type BookingInput = z.infer<typeof bookingSchema>;

export const updateBookingStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]),
});
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
