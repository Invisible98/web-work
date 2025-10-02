import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);

  const listenOptions: any = {
    port,
    // Bind to localhost by default on environments that may not support 0.0.0.0
    host: process.env.HOST || "127.0.0.1",
    // Only enable reusePort if explicitly requested via env var (some platforms don't support it)
    reusePort: process.env.REUSE_PORT === 'true',
  };

  function startServer(opts: any) {
    return new Promise<void>((resolve, reject) => {
      server.listen(opts, () => {
        log(`serving on port ${opts.port} (host: ${opts.host}${opts.reusePort ? ', reusePort' : ''})`);
        resolve();
      }).on('error', (err: any) => reject(err));
    });
  }

  try {
    await startServer(listenOptions);
  } catch (err: any) {
    console.error('Failed to listen with initial options:', err && err.message);
    // If the platform doesn't support reusePort or binding to 0.0.0.0, retry without reusePort
    try {
      const fallback = { ...listenOptions, reusePort: false };
      await startServer(fallback);
    } catch (err2: any) {
      console.error('Retry without reusePort failed:', err2 && err2.message);
      // Last resort: bind to localhost only (some Windows environments don't allow 0.0.0.0)
      try {
        const localhostFallback = { port, host: '127.0.0.1', reusePort: false };
        await startServer(localhostFallback);
      } catch (err3: any) {
        console.error('Final retry on localhost failed:', err3 && err3.message);
        throw err3;
      }
    }
  }
})();
