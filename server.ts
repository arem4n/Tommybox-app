import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { ExpressAuth } from "@auth/express";
import CredentialsProvider from "@auth/express/providers/credentials";

// We'll use the mock users from our existing mockData
import { mockUsers, mockTrainer } from "./services/mockData";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Set up Auth.js
  app.use(
    "/api/auth/*all",
    ExpressAuth({
      providers: [
        CredentialsProvider({
          name: "Credentials",
          credentials: {
            usernameOrEmail: { label: "Email or Username", type: "text" },
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials) {
            if (!credentials?.usernameOrEmail || !credentials?.password) {
              return null;
            }
            
            const inputLogin = (credentials.usernameOrEmail as string).toLowerCase().trim();
            const password = credentials.password as string;

            // Check if it's the trainer
            if (
              (mockTrainer.email.toLowerCase() === inputLogin || mockTrainer.username.toLowerCase() === inputLogin) &&
              mockTrainer.password === password
            ) {
              return {
                id: mockTrainer.id,
                name: mockTrainer.displayName || mockTrainer.username,
                email: mockTrainer.email,
                image: mockTrainer.photoURL,
                role: "trainer"
              };
            }

            // Check if it's a client
            const foundUser = mockUsers.find(u => 
                u.email.toLowerCase() === inputLogin || 
                u.username.toLowerCase() === inputLogin
            );

            if (foundUser && foundUser.password === password) {
              return {
                id: foundUser.id,
                name: foundUser.displayName || foundUser.username,
                email: foundUser.email,
                image: foundUser.photoURL,
                role: "client"
              };
            }

            return null;
          }
        })
      ],
      trustHost: true,
      secret: process.env.AUTH_SECRET || "a-very-secret-key-for-auth",
      callbacks: {
        async jwt({ token, user }) {
          if (user) {
            token.role = (user as any).role;
            token.id = user.id;
          }
          return token;
        },
        async session({ session, token }) {
          if (session.user) {
            (session.user as any).role = token.role;
            (session.user as any).id = token.id;
          }
          return session;
        }
      }
    })
  );

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/register", (req, res) => {
    const { email, password } = req.body;
    
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: "El email ya está registrado. Por favor, inicia sesión." });
    }
    
    const newUserId = `client${Date.now()}`;
    const newUser = {
        id: newUserId,
        email: email,
        username: email.split('@')[0],
        displayName: email.split('@')[0],
        password: password,
        isTrainer: false,
        registrationCompleted: false,
        // We omit complex objects like gamification for the server-side mock
    };
    
    mockUsers.push(newUser as any);
    res.json({ success: true, user: newUser });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
