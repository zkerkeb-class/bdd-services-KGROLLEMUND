const request = require('supertest');
const express = require('express');
const router = require('../routes/user.route');
const { PrismaClient } = require('@prisma/client');

// Mock du client Prisma
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

const app = express();
app.use(express.json());
app.use('/users', router);

describe('User Routes', () => {
  let prisma;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('GET /users/:id', () => {
    it('should return a user when a valid ID is provided', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app).get('/users/user-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          isSubscribed: true,
          subscriptionId: true,
          isProfileCompleted: true,
          isVerified: true,
          sector: true,
          subscriptionEndDate: true,
          accounts: true,
          createdAt: true,
          updatedAt: true,
          verificationToken: true,
          resetToken: true,
          resetTokenExpiry: true
        }
      });
    });

    it('should return 404 if user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/users/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Utilisateur non trouvé' });
    });
  });

  describe('PUT /users/subscription/:email', () => {
    const email = 'test@example.com';
    const updateData = {
      isSubscribed: false,
      subscriptionEndDate: new Date().toISOString(),
    };

    it('should update a user subscription status by email', async () => {
      const mockUser = { id: 'user-123', email: email };
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, ...updateData });

      const response = await request(app)
        .put(`/users/subscription/${email}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: email }, { normalizedEmail: email }],
        },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          isSubscribed: true,
          subscriptionEndDate: true,
        },
      });
      expect(response.body.isSubscribed).toBe(false);
    });

    it('should return 404 if user is not found by email', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .put(`/users/subscription/${email}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Utilisateur non trouvé');
    });
  });
}); 