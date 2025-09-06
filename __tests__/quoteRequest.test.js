const request = require('supertest');
const express = require('express');
const router = require('../routes/quote-request.route');
const { PrismaClient } = require('@prisma/client');

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    quoteRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

const app = express();
app.use(express.json());
app.use('/quote-requests', router);

describe('Quote Request Routes', () => {
  let prisma;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('POST /quote-requests', () => {
    it('should create a new quote request', async () => {
      const quoteData = {
        userId: 'user-123',
        title: 'New Website',
        description: 'A website for my company',
      };
      const createdQuote = { id: 'quote-456', ...quoteData, status: 'analysed' };

      prisma.quoteRequest.create.mockResolvedValue(createdQuote);

      const response = await request(app)
        .post('/quote-requests')
        .send(quoteData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdQuote);
      expect(prisma.quoteRequest.create).toHaveBeenCalledWith({
        data: {
          ...quoteData,
          aiAnalysis: null,
          tasksEstimation: [],
          totalEstimate: null,
          timeEstimate: null,
          status: 'analysed',
        },
      });
    });

    it('should return 400 if required data is missing', async () => {
        const response = await request(app)
          .post('/quote-requests')
          .send({ userId: 'user-123' });
  
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Données manquantes (userId, title, description requis)' });
      });
  });

  describe('GET /quote-requests/:id', () => {
    it('should return a quote request by ID', async () => {
        const mockQuote = { id: 'quote-456', title: 'Test Quote' };
        prisma.quoteRequest.findUnique.mockResolvedValue(mockQuote);
  
        const response = await request(app).get('/quote-requests/quote-456');
  
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockQuote);
        expect(prisma.quoteRequest.findUnique).toHaveBeenCalledWith({
            where: { id: 'quote-456' },
            include: { user: true },
        });
      });
  
      it('should return 404 if quote request is not found', async () => {
        prisma.quoteRequest.findUnique.mockResolvedValue(null);
  
        const response = await request(app).get('/quote-requests/non-existent-id');
  
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Quote request not found' });
      });
  });
}); 