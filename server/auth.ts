import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore as any,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  // Mock user endpoint - always return a default user
  app.get("/api/user", (req, res) => {
    res.json({
      id: "default-user",
      username: "admin",
      role: "admin",
      createdAt: new Date(),
    });
  });
}