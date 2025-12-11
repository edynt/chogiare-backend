import { PrismaService } from '../database/prisma.service';

export async function isAdmin(userId: number, prisma: PrismaService): Promise<boolean> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return userRoles.some((ur) => ur.role.name === 'admin');
}
