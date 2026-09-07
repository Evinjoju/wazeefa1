import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

export const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import userRoutes from './routes/users';
import permissionRoutes from './routes/permissions';
import { apiRateLimiter } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

// Apply rate limiter to all API routes
app.use('/api/', apiRateLimiter);

app.use('/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/permissions', permissionRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Generic Error Handler (MUST be last)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
