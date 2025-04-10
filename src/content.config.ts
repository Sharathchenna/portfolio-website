import {defineCollection, z} from 'astro:content'

// Define local content collections instead of relying on external directories
const website = defineCollection({
  type: 'content',
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string(),
      links: z.record(z.string()).default({}),
    }),
})

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    shortTitle: z.string().optional(),
    description: z.string(),
    published: z.boolean().default(false),
    unlisted: z.boolean().default(false),
    tags: z.string().array().default([]),
    date: z.coerce.date(),
    sup: z.string().optional(),
  }),
})

const tags = defineCollection({
  type: 'data',
  schema: z.array(
    z.object({
      name: z.string(),
    })
  ),
})

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    redirect: z.string().url().optional(),
    unlisted: z.boolean().default(false),
    image: z.string().optional(),
  }),
})

const skills = defineCollection({
  type: 'data',
  schema: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
    })
  ),
})

// Export the collections
export const collections = {website, posts, tags, projects, skills}
