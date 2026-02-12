import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    category: z.enum([
      'facial',
      'body',
      'breast',
      'non-surgical',
      'recovery',
      'news',
    ]),
    tags: z.array(z.string()),
    coverImage: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

const clinics = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/clinics' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    city: z.string(),
    state: z.string(),
    address: z.string(),
    zipCode: z.string(),
    phone: z.string(),
    website: z.string().url().nullable().optional(),
    email: z.string().email().optional(),
    googleMapsUrl: z.string().url().optional(),
    description: z.string(),
    specialties: z.array(z.string()),
    surgeons: z.array(z.object({
      name: z.string(),
      title: z.string(),
      specialties: z.array(z.string()).optional(),
      photo: z.string().optional(),
      bio: z.string().optional(),
    })).optional(),
    rating: z.number().min(0).max(5),
    reviewCount: z.number(),
    reviews: z.array(z.object({
      author: z.string(),
      rating: z.number(),
      date: z.string(),
      procedure: z.string().optional(),
      text: z.string(),
      source: z.string().optional(),
    })).optional(),
    logo: z.string().nullable().optional(),
    photos: z.array(z.string()).optional(),
    yearEstablished: z.number().nullable().optional(),
    certifications: z.array(z.string()).optional(),
    verified: z.boolean().default(false),
    featured: z.boolean().default(false),
    lastUpdated: z.string(),
  }),
});

const cities = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/cities' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    state: z.string(),
    stateFullName: z.string(),
    description: z.string(),
    metaDescription: z.string(),
    coverImage: z.string().nullable().optional(),
    featuredClinics: z.array(z.string()).nullable().optional(),
  }),
});

export const collections = { blog, clinics, cities };
