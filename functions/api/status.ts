import { type Env, json } from '../_lib';

// Публічна перевірка статусу: повертає лише статус, без персональних даних.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const n = new URL(request.url).searchParams.get('n')?.trim().toUpperCase() ?? '';
  if (!/^S\d+-\d{1,2}-\d{4}$/.test(n)) return json({ error: 'bad number' }, 400);
  const raw = await env.APPEALS.get(`appeal:${n}`);
  if (!raw) return json({ error: 'not found' }, 404);
  return json({ number: n, status: JSON.parse(raw).status });
};
