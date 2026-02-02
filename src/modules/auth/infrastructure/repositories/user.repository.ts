import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { IUserRepository } from '@modules/auth/domain/repositories/user.repository.interface';
import { User } from '@modules/auth/domain/entities/user.entity';
import { User as PrismaUser, Prisma } from '@prisma/client';

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

  async create(userData: Partial<User>): Promise<User> {
    const now = BigInt(Date.now());
    const user = await this.prisma.user.create({
      data: {
        email: userData.email!,
        hashedPassword: userData.hashedPassword!,
        isVerified: userData.isVerified ?? false,
        status: userData.status ?? true,
        language: userData.language ?? 0,
        fullName: userData.fullName ?? null,
        avatarUrl: userData.avatarUrl ?? null,
        gender: userData.gender ?? null,
        dateOfBirth: userData.dateOfBirth ?? null,
        phoneNumber: userData.phoneNumber ?? null,
        address: userData.address ?? null,
        country: userData.country ?? null,
        profileMetadata: (userData.profileMetadata as Prisma.InputJsonValue) ?? null,
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
        ...(userData.hashedPassword && { hashedPassword: userData.hashedPassword }),
        ...(userData.isVerified !== undefined && { isVerified: userData.isVerified }),
        ...(userData.status !== undefined && { status: userData.status }),
        ...(userData.language !== undefined && { language: userData.language }),
        updatedAt: BigInt(Date.now()),
      },
    });
    return this.toDomain(user);
  }

  private toDomain(prismaUser: PrismaUser): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      hashedPassword: prismaUser.hashedPassword,
      isVerified: prismaUser.isVerified,
      status: prismaUser.status,
      language: prismaUser.language,
      fullName: prismaUser.fullName,
      avatarUrl: prismaUser.avatarUrl,
      gender: prismaUser.gender,
      dateOfBirth: prismaUser.dateOfBirth,
      phoneNumber: prismaUser.phoneNumber,
      address: prismaUser.address,
      country: prismaUser.country,
      profileMetadata: prismaUser.profileMetadata as Record<string, unknown> | null,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}
