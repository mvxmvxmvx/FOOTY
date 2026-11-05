// Supabase Edge Functions intentionally cannot host HTML on default domains.
// This endpoint is deliberately retired: the actual website lives in GitHub Pages /beta.
Deno.serve(() => new Response(JSON.stringify({
  status:"retired",
  reason:"HTML rendering is blocked on Supabase's default Edge Function domain.",
  frontend:"GitHub Pages, after repository owner enables Pages",
  githubPagesSettings:"https://github.com/mvxmvxmvx/FOOTY/settings/pages"
}),{status:410,headers:{"Content-Type":"application/json; charset=utf-8",
  "Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}}));
