import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@modules/auth/domain/repositories/user.repository.interface';
import { User } from '@modules/auth/domain/entities/user.entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user ? this.toDomain(user) : null;
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? this.toDomain(user) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    return user ? this.toDomain(user) : null;
  }

  async create(userData: Partial<User>): Promise<User> {
    const now = BigInt(Date.now());
    const user = await this.prisma.user.create({
      data: {
        email: userData.email!,
        username: userData.username,
        hashedPassword: userData.hashedPassword!,
        isVerified: userData.isVerified ?? false,
        status: userData.status ?? true,
        language: userData.language ?? 'vi',
        createdAt: now,
        updatedAt: now,
      },
    });
    return this.toDomain(user);
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(userData.email && { email: userData.email }),
        ...(userData.username !== undefined && { username: userData.username }),
        ...(userData.hashedPassword && { hashedPassword: userData.hashedPassword }),
        ...(userData.isVerified !== undefined && { isVerified: userData.isVerified }),
        ...(userData.status !== undefined && { status: userData.status }),
        ...(userData.language && { language: userData.language }),
        updatedAt: BigInt(Date.now()),
      },
    });
    return this.toDomain(user);
  }

  private toDomain(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      username: prismaUser.username,
      hashedPassword: prismaUser.hashedPassword,
      isVerified: prismaUser.isVerified,
      status: prismaUser.status,
      language: prismaUser.language,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}
