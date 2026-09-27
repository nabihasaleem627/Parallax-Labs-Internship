import { z } from "zod";

// Helper to validate 24-hour time string in HH:MM format
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const bookingStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
]);

export type BookingStatusType = z.infer<typeof bookingStatusEnum>;

/**
 * Shared validation rules for creating and updating bookings.
 * Enforces strong typing, length bounds, and logical time sequencing.
 */
export const createBookingSchema = z
  .object({
    customerName: z
      .string({ required_error: "Customer name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),

    customerEmail: z
      .string({ required_error: "Customer email is required" })
      .trim()
      .email("Please provide a valid email address")
      .max(120, "Email cannot exceed 120 characters"),

    customerPhone: z
      .string()
      .trim()
      .max(30, "Phone number cannot exceed 30 characters")
      .optional()
      .or(z.literal("")),

    serviceId: z.string().optional().or(z.literal("")),
    serviceName: z
      .string()
      .trim()
      .max(120, "Service name cannot exceed 120 characters")
      .default("General Appointment"),

    bookingDate: z
      .string({ required_error: "Booking date is required" })
      .min(1, "Booking date is required")
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format. Use YYYY-MM-DD or ISO date.",
      }),

    startTime: z
      .string({ required_error: "Start time is required" })
      .regex(timeFormatRegex, "Start time must be in 24-hour HH:MM format (e.g. 09:00)"),

    endTime: z
      .string({ required_error: "End time is required" })
      .regex(timeFormatRegex, "End time must be in 24-hour HH:MM format (e.g. 10:00)"),

    status: bookingStatusEnum.default("CONFIRMED"),

    notes: z
      .string()
      .max(1000, "Notes cannot exceed 1000 characters")
      .optional()
      .or(z.literal("")),

    price: z
      .number()
      .min(0, "Price cannot be negative")
      .optional()
      .default(0)
      .or(z.string().transform((val) => (val === "" ? 0 : Number(val)))),
  })
  .refine(
    (data) => {
      // Validate that start time comes strictly before end time
      const [startH, startM] = data.startTime.split(":").map(Number);
      const [endH, endM] = data.endTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return endMinutes > startMinutes;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const updateBookingSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters")
      .optional(),

    customerEmail: z
      .string()
      .trim()
      .email("Please provide a valid email address")
      .max(120, "Email cannot exceed 120 characters")
      .optional(),

    customerPhone: z
      .string()
      .trim()
      .max(30, "Phone number cannot exceed 30 characters")
      .optional()
      .nullable(),

    serviceId: z.string().optional().nullable(),
    serviceName: z
      .string()
      .trim()
      .max(120, "Service name cannot exceed 120 characters")
      .optional(),

    bookingDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      })
      .optional(),

    startTime: z
      .string()
      .regex(timeFormatRegex, "Start time must be in 24-hour HH:MM format")
      .optional(),

    endTime: z
      .string()
      .regex(timeFormatRegex, "End time must be in 24-hour HH:MM format")
      .optional(),

    status: bookingStatusEnum.optional(),

    notes: z
      .string()
      .max(1000, "Notes cannot exceed 1000 characters")
      .optional()
      .nullable(),

    price: z
      .number()
      .min(0, "Price cannot be negative")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        const [startH, startM] = data.startTime.split(":").map(Number);
        const [endH, endM] = data.endTime.split(":").map(Number);
        return endH * 60 + endM > startH * 60 + startM;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const bookingQuerySchema = z.object({
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: bookingStatusEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type BookingQueryInput = z.infer<typeof bookingQuerySchema>;
