import { serve } from "bun";
import index from "./index.html";

const server = serve({
  // Bun.serve() defaults to PORT env or 3000, same default as the botmanager backend
  // (BUN_PUBLIC_API_URL). Use a distinct default here so the two never collide.
  port: process.env.PORT ?? 5173,
  routes: {
    // Serve index.html for all routes — client-side routing (react-router-dom)
    // handles path matching in the browser, including on hard refresh of deep links.
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
