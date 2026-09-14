import { z } from "zod";
const mobile = z
  .string({ required_error: "Mobile number is required." })
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit Indian mobile number.");
const email = z
  .string({ required_error: "Email address is required." })
  .trim()
  .email("Enter a valid email address.")
  .max(190, "Email address must be 190 characters or fewer.");
const shopName = z
  .string({ required_error: "Shop name is required." })
  .trim()
  .min(2, "Shop name must contain at least 2 characters after spaces are removed.")
  .max(100, "Shop name must be 100 characters or fewer.");
export const registerSchema = z.object({
  email,
  mobileNumber: mobile.optional(),
  shopName,
  password: z.string({ required_error: "Password is required." }).min(8, "Password must be at least 8 characters.").max(72, "Password must be 72 characters or fewer."),
});
export const loginSchema = z.object({
  email,
  mobileNumber: mobile.optional(),
  password: z.string().min(1),
});
export const shopSchema = z.object({
  shopName,
  addressLine: z.string({ required_error: "Address is required." }).trim().min(3, "Address must be at least 3 characters."),
  area: z.string({ required_error: "Area is required." }).trim().min(2, "Area must be at least 2 characters.").max(100),
  city: z.string({ required_error: "City is required." }).trim().min(2, "City must be at least 2 characters.").max(100),
  state: z.string({ required_error: "State is required." }).trim().min(2, "State must be at least 2 characters.").max(100),
  pincode: z.string({ required_error: "Pincode is required." }).trim().regex(/^\d{6}$/, "Pincode must be exactly 6 digits."),
  locationUrl: z.string().trim().url("Enter a valid Google Maps URL.").optional().or(z.literal("")),
});
export const productSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().min(10),
  basePrice: z.coerce.number().positive("Price must be greater than zero.").max(999999999).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  seoTitle: z.string().max(70).optional().nullable(),
  seoDescription: z.string().max(170).optional().nullable(),
});
export const reviewSchema=z.object({name:z.string().trim().min(2,"Your name is required.").max(80),rating:z.number().int().min(1,"Choose a rating from 1 to 5.").max(5,"Choose a rating from 1 to 5."),comment:z.string().trim().min(5,"Please write at least 5 characters.").max(1000)});
export const userAuthSchema = z.object({ email, password: z.string().min(8, "Use at least 8 characters.").max(72), fullName: z.string().trim().min(2).max(120).optional() });
