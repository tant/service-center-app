import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { createTRPCContext } from "@/server/trpc";

const handler = async (req: Request) => {
  const startTime = Date.now();
  const url = new URL(req.url);
  const procedure = url.pathname.split("/").pop();

  console.log("🌐 SERVER: tRPC HTTP handler called");
  console.log("📋 SERVER: Method:", req.method);
  console.log("🔗 SERVER: URL:", req.url);
  console.log("🎯 SERVER: Procedure:", procedure);
  console.log("📊 SERVER: Headers:", Object.fromEntries(req.headers.entries()));

  try {
    const body = await req.clone().text();
    console.log("📦 SERVER: Request body length:", body.length);
    if (body.length < 500) {
      console.log("📦 SERVER: Request body:", body);
    } else {
      console.log(
        "📦 SERVER: Request body (truncated):",
        `${body.substring(0, 200)}...`,
      );
    }
  } catch (e) {
    console.log("❌ SERVER: Could not read request body:", e);
  }

  console.log("🚀 SERVER: Calling fetchRequestHandler...");

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req }),
  });

  const duration = Date.now() - startTime;
  console.log("📤 SERVER: Response status:", response.status);
  console.log("⏱️ SERVER: Request duration:", `${duration}ms`);

  if (response.status >= 400) {
    try {
      const responseText = await response.clone().text();
      console.log(
        "🔴 SERVER: Error response body:",
        responseText.substring(0, 300),
      );
    } catch (_e) {
      console.log("❌ SERVER: Could not read response body");
    }
  }

  return response;
};

export { handler as GET, handler as POST };
