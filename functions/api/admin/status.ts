import { type Env, json, STATUSES } from '../../_lib';

// Зміна статусу (викликає таблиця/бот приймальні): POST {number, status} з заголовком Authorization: Bearer ADMIN_TOKEN
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.ADMIN_TOKEN || request.headers.get('authorization') !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: 'unauthorized' }, 401);
  const { number, status } = (await request.json()) as { number: string; status: string };
  if (!STATUSES.includes(status as any)) return json({ error: 'bad status' }, 400);
  const key = `appeal:${String(number).toUpperCase()}`;
  const raw = await env.APPEALS.get(key);
  if (!raw) return json({ error: 'not found' }, 404);
  await env.APPEALS.put(key, JSON.stringify({ ...JSON.parse(raw), status }));
  return json({ ok: true });
};
