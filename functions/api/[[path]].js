const VPS = 'http://104.196.126.212:8000';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const target = VPS + url.pathname.replace(/^\/api/, '') + url.search;

  const init = {
    method: context.request.method,
    headers: Object.fromEntries(context.request.headers),
  };
  if (!['GET', 'HEAD'].includes(context.request.method)) {
    init.body = context.request.body;
  }

  const resp = await fetch(target, init);
  return new Response(resp.body, {
    status:  resp.status,
    headers: resp.headers,
  });
}
