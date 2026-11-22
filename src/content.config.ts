import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const post = z.object({
  title: z.string(),
  date: z.coerce.date(),
  tag: z.string().optional(),
  image: z.string().optional(),
  excerpt: z.string(),
  // Ключ, що пов'язує українську та англійську версії однієї публікації
  key: z.string(),
  draft: z.boolean().default(false),
});

export const collections = {
  news: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/news' }), schema: post }),
  blog: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/blog' }), schema: post }),
  media: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/media' }),
    schema: post.extend({ youtube: z.string() }),
  }),
};
