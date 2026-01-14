import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This should show if depositPackage exists
type PrismaModels = keyof PrismaClient;
const models: PrismaModels[] = [] as any;
console.log('Available models:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')));
