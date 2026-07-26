export interface AssetBinding { fetch(request: Request): Promise<Response> }
export interface Env { ASSETS: AssetBinding; RELEASE: string }
export default { async fetch(request:Request,env:Env):Promise<Response>{
  const url=new URL(request.url);
  if(url.pathname==="/api/health")return Response.json({ok:true,release:env.RELEASE},{headers:{"cache-control":"no-store"}});
  const response=await env.ASSETS.fetch(request);
  const headers=new Headers(response.headers);
  headers.set("x-content-type-options","nosniff"); headers.set("referrer-policy","strict-origin-when-cross-origin"); headers.set("permissions-policy","camera=(), microphone=(), geolocation=()");
  if((headers.get("content-type")||"").includes("text/html"))headers.set("content-security-policy","default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}};
