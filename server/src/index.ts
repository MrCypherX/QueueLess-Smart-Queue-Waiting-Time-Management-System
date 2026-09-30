import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initDb } from './db';

import authRoutes from './routes/auth.routes';
import locationRoutes from './routes/location.routes';
import counterRoutes from './routes/counter.routes';
import tokenRoutes from './routes/token.routes';
import aiRoutes from './routes/ai.routes';
import notificationRoutes from './routes/notification.routes';
import analyticsRoutes from './routes/analytics.routes';
import eventsRoutes from './routes/events.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // allows SSE & client assets
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: true, // Allow frontend dev server and production origins
    credentials: true,
  })
);

app.use(express.json());

// Request logger in dev
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'QueueLess API Server',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/counters', counterRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/events', eventsRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred',
  });
});

// Auto-migrate schema and start server
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`🚀 QueueLess API Server running on port ${PORT}`);
      console.log(`🔗 Health check available at http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start QueueLess server:', err);
    process.exit(1);
  }
}

startServer();
