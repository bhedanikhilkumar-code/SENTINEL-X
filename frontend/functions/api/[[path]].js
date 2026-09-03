export async function onRequest(context) {
  const url = new URL(context.request.url);
  // Default to our active Cloudflare tunnel backend URL
  const backendBase =
    context.env.BACKEND_URL ||
    "https://sorry-reader-society-writing.trycloudflare.com";
  const targetUrl = `${backendBase}${url.pathname}${url.search}`;

  const reqHeaders = new Headers(context.request.headers);
  reqHeaders.set("Host", new URL(backendBase).host);

  const forwardReq = new Request(targetUrl, {
    method: context.request.method,
    headers: reqHeaders,
    body:
      context.request.method !== "GET" && context.request.method !== "HEAD"
        ? context.request.body
        : undefined,
    redirect: "follow",
  });

  return fetch(forwardReq);
}
