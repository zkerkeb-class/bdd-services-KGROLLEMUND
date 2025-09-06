const request = require('supertest');
const express = require('express');
const router = require('../routes/subscription.route');
const { PrismaClient } = require('@prisma/client');

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    subscription: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

const app = express();
app.use(express.json());
app.use('/subscriptions', router);

describe('Subscription Routes', () => {
  let prisma;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('POST /subscriptions', () => {
    const subData = {
      userId: 'user-123',
      stripeSubscriptionId: 'stripe-sub-123',
      plan: 'premium',
      status: 'active',
      endDate: new Date().toISOString(),
    };

    it('should create a new subscription if none exists for the user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      prisma.subscription.findFirst.mockResolvedValue(null);
      prisma.subscription.create.mockResolvedValue({ id: 1, ...subData });
      prisma.user.update.mockResolvedValue({});

      const response = await request(app).post('/subscriptions').send(subData);

      expect(response.status).toBe(201);
      expect(prisma.subscription.create).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should update an existing subscription if one is found for the user', async () => {
        const existingSub = { id: 1, userId: 'user-123', stripeSubscriptionId: 'old-stripe-id' };
        
        prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
        prisma.subscription.findFirst.mockResolvedValue(existingSub);
        prisma.subscription.update.mockResolvedValue({ ...existingSub, ...subData });
        prisma.user.update.mockResolvedValue({});
  
        const response = await request(app).post('/subscriptions').send(subData);
  
        expect(response.status).toBe(200);
        expect(prisma.subscription.update).toHaveBeenCalledWith({
            where: { id: existingSub.id },
            data: subData,
        });
        expect(prisma.user.update).toHaveBeenCalled();
      });

    it('should return 404 if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app).post('/subscriptions').send(subData);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /subscriptions/stripe/:stripeId', () => {
    const stripeId = 'stripe-sub-123';
    const updateData = {
      status: 'cancelled',
      isActive: false,
    };

    it('should update a subscription by its Stripe ID', async () => {
      const mockUpdatedSub = { id: 1, stripeSubscriptionId: stripeId, ...updateData };
      prisma.subscription.update.mockResolvedValue(mockUpdatedSub);

      const response = await request(app)
        .put(`/subscriptions/stripe/${stripeId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: stripeId },
        data: expect.objectContaining(updateData),
      });
      expect(response.body.status).toBe('cancelled');
    });

    it('should return 404 if subscription is not found', async () => {
      // Simuler une erreur P2025 de Prisma (record not found)
      const prismaError = new Error('Record to update not found.');
      prismaError.code = 'P2025';
      prisma.subscription.update.mockRejectedValue(prismaError);

      const response = await request(app)
        .put(`/subscriptions/stripe/${stripeId}`)
        .send(updateData);
      
      expect(response.status).toBe(404);
    });
  });
}); 