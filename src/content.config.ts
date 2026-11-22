import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const collections = {
  // Документи УН — дослівні тексти від Юрія Камельчука (Google Doc «Документи УН»)
  docs: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
    // hidden: true — внутрішній документ, на сайті не показується
    schema: z.object({ title: z.string(), description: z.string(), order: z.number(), hidden: z.boolean().default(false) }),
  }),
  // Новини кампанії: готує команда, погоджує Юрій. Мінімум двічі на тиждень.
  news: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
    schema: z.object({
      title: z.string(),
      date: z.coerce.date(),
      // Один із 5 стовпів: state | energy | europe | fair | team
      pillar: z.enum(['state', 'energy', 'europe', 'fair', 'team']).optional(),
      image: z.string().optional(),
      excerpt: z.string(),
      key: z.string(),
      draft: z.boolean().default(false),
    }),
  }),
};
