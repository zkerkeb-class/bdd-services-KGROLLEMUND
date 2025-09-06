const request = require('supertest');
const express = require('express');
const router = require('../routes/professional-profile.route');
const { PrismaClient } = require('@prisma/client');

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    professionalProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
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
app.use('/profiles', router);

describe('Professional Profile Routes', () => {
  let prisma;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('POST /profiles', () => {
    it('should create a new professional profile', async () => {
      const profileData = {
        userId: 'user-123',
        sector: 'IT',
        specialties: ['Node.js', 'React'],
        yearsOfExperience: 5,
      };
      const createdProfile = { id: 'profile-789', ...profileData };

      prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      prisma.professionalProfile.findUnique.mockResolvedValue(null);
      prisma.professionalProfile.create.mockResolvedValue(createdProfile);
      prisma.user.update.mockResolvedValue({});

      const response = await request(app).post('/profiles').send(profileData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdProfile);
      expect(prisma.professionalProfile.create).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: profileData.userId },
        data: { isProfileCompleted: true },
      });
    });

    it('should return 409 if a profile already exists for the user', async () => {
      const profileData = { userId: 'user-123', sector: 'IT' };

      prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      prisma.professionalProfile.findUnique.mockResolvedValue({ id: 'existing-profile' });

      const response = await request(app).post('/profiles').send(profileData);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: 'Un profil existe déjà pour cet utilisateur' });
    });
  });

  describe('GET /profiles/user/:userId', () => {
    it('should return a profile by user ID', async () => {
      const mockProfile = { id: 'profile-789', userId: 'user-123', sector: 'IT' };

      prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      prisma.professionalProfile.findUnique.mockResolvedValue(mockProfile);

      const response = await request(app).get('/profiles/user/user-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProfile);
    });

    it('should return 404 if profile is not found', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      prisma.professionalProfile.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/profiles/user/user-123');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Profil non trouvé' });
    });

    it('should return 404 if user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/profiles/user/non-existent-user-id');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Utilisateur non trouvé' });
    });
  });
}); 