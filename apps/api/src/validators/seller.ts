import { z } from "zod";
const mobile = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit Indian mobile number");
const email = z.string().trim().email("Enter a valid email address").max(190);
export const registerSchema = z.object({
  email,
  mobileNumber: mobile.optional(),
  shopName: z.string().trim().min(2).max(100),
  password: z.string().min(8).max(72),
});
export const loginSchema = z.object({
  email,
  mobileNumber: mobile.optional(),
  password: z.string().min(1),
});
export const shopSchema = z.object({
  shopName: z.string().trim().min(2).max(100),
  addressLine: z.string().trim().min(3),
  area: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationUrl: z.string().url().optional().or(z.literal("")),
});
export const productSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().min(10),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  seoTitle: z.string().max(70).optional().nullable(),
  seoDescription: z.string().max(170).optional().nullable(),
});
export const reviewSchema=z.object({name:z.string().trim().min(2,"Your name is required.").max(80),rating:z.number().int().min(1,"Choose a rating from 1 to 5.").max(5,"Choose a rating from 1 to 5."),comment:z.string().trim().min(5,"Please write at least 5 characters.").max(1000)});
export const userAuthSchema = z.object({ email, password: z.string().min(8, "Use at least 8 characters.").max(72), fullName: z.string().trim().min(2).max(120).optional() });
