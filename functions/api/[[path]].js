const VPS_URL = 'https://publishers-pearl-wings-accordingly.trycloudflare.com';

export async function onRequest(context) {
  const vps = context.env.VPS_URL || VPS_URL;
  const url = new URL(context.request.url);
  const target = vps + url.pathname.replace(/^\/api/, '') + url.search;

  const headers = {};
  for (const [k, v] of context.request.headers) {
    if (k.toLowerCase() !== 'host') headers[k] = v;
  }

  const init = { method: context.request.method, headers };
  if (!['GET', 'HEAD'].includes(context.request.method)) {
    init.body = context.request.body;
  }

  const resp = await fetch(target, init);
  return new Response(resp.body, {
    status:  resp.status,
    headers: resp.headers,
  });
}
