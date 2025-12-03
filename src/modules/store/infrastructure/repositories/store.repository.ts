import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import {
  IStoreRepository,
  STORE_REPOSITORY,
} from '../../domain/repositories/store.repository.interface';
import { Store } from '../../domain/entities/store.entity';

@Injectable()
export class StoreRepository implements IStoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Store | null> {
    const store = await this.prisma.store.findUnique({
      where: { id },
    });

    return store ? this.toDomain(store) : null;
  }

  async findBySlug(slug: string): Promise<Store | null> {
    const store = await this.prisma.store.findUnique({
      where: { slug },
    });

    return store ? this.toDomain(store) : null;
  }

  async findByUserId(userId: string): Promise<Store | null> {
    const store = await this.prisma.store.findFirst({
      where: { userId },
    });

    return store ? this.toDomain(store) : null;
  }

  async findAll(options?: {
    search?: string;
    isVerified?: boolean;
    isActive?: boolean;
    city?: string;
    state?: string;
    country?: string;
    skip?: number;
    take?: number;
  }): Promise<Store[]> {
    const where: any = {};

    if (options?.isVerified !== undefined) {
      where.isVerified = options.isVerified;
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.city) {
      where.addressCity = options.city;
    }

    if (options?.state) {
      where.addressCity = options.state;
    }

    if (options?.country) {
      where.addressCity = options.country;
    }

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
        { slug: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const stores = await this.prisma.store.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return stores.map((s) => this.toDomain(s));
  }

  async create(
    data: Omit<Store, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount' | 'productCount' | 'followerCount'>,
  ): Promise<Store> {
    const now = BigInt(Date.now());
    const store = await this.prisma.store.create({
      data: {
        userId: data.userId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        logo: data.logo,
        banner: data.banner,
        category: data.category,
        subcategory: data.subcategory,
        establishedYear: data.establishedYear,
        businessType: data.businessType,
        taxCode: data.taxCode,
        businessLicense: data.businessLicense,
        addressStreet: data.addressStreet,
        addressWard: data.addressWard,
        addressDistrict: data.addressDistrict,
        addressCity: data.addressCity,
        addressPostalCode: data.addressPostalCode,
        addressLat: data.addressLat,
        addressLng: data.addressLng,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        contactWebsite: data.contactWebsite,
        contactFacebook: data.contactFacebook,
        contactInstagram: data.contactInstagram,
        contactTiktok: data.contactTiktok,
        contactYoutube: data.contactYoutube,
        businessHoursMondayOpen: data.businessHoursMondayOpen,
        businessHoursMondayClose: data.businessHoursMondayClose,
        businessHoursMondayIsOpen: data.businessHoursMondayIsOpen,
        businessHoursTuesdayOpen: data.businessHoursTuesdayOpen,
        businessHoursTuesdayClose: data.businessHoursTuesdayClose,
        businessHoursTuesdayIsOpen: data.businessHoursTuesdayIsOpen,
        businessHoursWednesdayOpen: data.businessHoursWednesdayOpen,
        businessHoursWednesdayClose: data.businessHoursWednesdayClose,
        businessHoursWednesdayIsOpen: data.businessHoursWednesdayIsOpen,
        businessHoursThursdayOpen: data.businessHoursThursdayOpen,
        businessHoursThursdayClose: data.businessHoursThursdayClose,
        businessHoursThursdayIsOpen: data.businessHoursThursdayIsOpen,
        businessHoursFridayOpen: data.businessHoursFridayOpen,
        businessHoursFridayClose: data.businessHoursFridayClose,
        businessHoursFridayIsOpen: data.businessHoursFridayIsOpen,
        businessHoursSaturdayOpen: data.businessHoursSaturdayOpen,
        businessHoursSaturdayClose: data.businessHoursSaturdayClose,
        businessHoursSaturdayIsOpen: data.businessHoursSaturdayIsOpen,
        businessHoursSundayOpen: data.businessHoursSundayOpen,
        businessHoursSundayClose: data.businessHoursSundayClose,
        businessHoursSundayIsOpen: data.businessHoursSundayIsOpen,
        returnPolicy: data.returnPolicy,
        shippingPolicy: data.shippingPolicy,
        rating: 0,
        reviewCount: 0,
        productCount: 0,
        followerCount: 0,
        isVerified: data.isVerified ?? false,
        isActive: data.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.toDomain(store);
  }

  async update(id: string, data: Partial<Store>): Promise<Store> {
    const now = BigInt(Date.now());
    const store = await this.prisma.store.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        logo: data.logo,
        banner: data.banner,
        category: data.category,
        subcategory: data.subcategory,
        establishedYear: data.establishedYear,
        businessType: data.businessType,
        taxCode: data.taxCode,
        businessLicense: data.businessLicense,
        addressStreet: data.addressStreet,
        addressWard: data.addressWard,
        addressDistrict: data.addressDistrict,
        addressCity: data.addressCity,
        addressPostalCode: data.addressPostalCode,
        addressLat: data.addressLat,
        addressLng: data.addressLng,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        contactWebsite: data.contactWebsite,
        contactFacebook: data.contactFacebook,
        contactInstagram: data.contactInstagram,
        contactTiktok: data.contactTiktok,
        contactYoutube: data.contactYoutube,
        businessHoursMondayOpen: data.businessHoursMondayOpen,
        businessHoursMondayClose: data.businessHoursMondayClose,
        businessHoursMondayIsOpen: data.businessHoursMondayIsOpen,
        businessHoursTuesdayOpen: data.businessHoursTuesdayOpen,
        businessHoursTuesdayClose: data.businessHoursTuesdayClose,
        businessHoursTuesdayIsOpen: data.businessHoursTuesdayIsOpen,
        businessHoursWednesdayOpen: data.businessHoursWednesdayOpen,
        businessHoursWednesdayClose: data.businessHoursWednesdayClose,
        businessHoursWednesdayIsOpen: data.businessHoursWednesdayIsOpen,
        businessHoursThursdayOpen: data.businessHoursThursdayOpen,
        businessHoursThursdayClose: data.businessHoursThursdayClose,
        businessHoursThursdayIsOpen: data.businessHoursThursdayIsOpen,
        businessHoursFridayOpen: data.businessHoursFridayOpen,
        businessHoursFridayClose: data.businessHoursFridayClose,
        businessHoursFridayIsOpen: data.businessHoursFridayIsOpen,
        businessHoursSaturdayOpen: data.businessHoursSaturdayOpen,
        businessHoursSaturdayClose: data.businessHoursSaturdayClose,
        businessHoursSaturdayIsOpen: data.businessHoursSaturdayIsOpen,
        businessHoursSundayOpen: data.businessHoursSundayOpen,
        businessHoursSundayClose: data.businessHoursSundayClose,
        businessHoursSundayIsOpen: data.businessHoursSundayIsOpen,
        returnPolicy: data.returnPolicy,
        shippingPolicy: data.shippingPolicy,
        isVerified: data.isVerified,
        isActive: data.isActive,
        updatedAt: now,
      },
    });

    return this.toDomain(store);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.store.delete({
      where: { id },
    });
  }

  async count(options?: {
    search?: string;
    isVerified?: boolean;
    isActive?: boolean;
    city?: string;
    state?: string;
    country?: string;
  }): Promise<number> {
    const where: any = {};

    if (options?.isVerified !== undefined) {
      where.isVerified = options.isVerified;
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.city) {
      where.addressCity = options.city;
    }

    if (options?.state) {
      where.addressCity = options.state;
    }

    if (options?.country) {
      where.addressCity = options.country;
    }

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
        { slug: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.store.count({ where });
  }

  private toDomain(store: any): Store {
    return {
      id: store.id,
      userId: store.userId,
      name: store.name,
      slug: store.slug,
      description: store.description,
      shortDescription: store.shortDescription,
      logo: store.logo,
      banner: store.banner,
      category: store.category,
      subcategory: store.subcategory,
      establishedYear: store.establishedYear,
      businessType: store.businessType,
      taxCode: store.taxCode,
      businessLicense: store.businessLicense,
      addressStreet: store.addressStreet,
      addressWard: store.addressWard,
      addressDistrict: store.addressDistrict,
      addressCity: store.addressCity,
      addressPostalCode: store.addressPostalCode,
      addressLat: store.addressLat ? Number(store.addressLat) : undefined,
      addressLng: store.addressLng ? Number(store.addressLng) : undefined,
      contactPhone: store.contactPhone,
      contactEmail: store.contactEmail,
      contactWebsite: store.contactWebsite,
      contactFacebook: store.contactFacebook,
      contactInstagram: store.contactInstagram,
      contactTiktok: store.contactTiktok,
      contactYoutube: store.contactYoutube,
      businessHoursMondayOpen: store.businessHoursMondayOpen,
      businessHoursMondayClose: store.businessHoursMondayClose,
      businessHoursMondayIsOpen: store.businessHoursMondayIsOpen,
      businessHoursTuesdayOpen: store.businessHoursTuesdayOpen,
      businessHoursTuesdayClose: store.businessHoursTuesdayClose,
      businessHoursTuesdayIsOpen: store.businessHoursTuesdayIsOpen,
      businessHoursWednesdayOpen: store.businessHoursWednesdayOpen,
      businessHoursWednesdayClose: store.businessHoursWednesdayClose,
      businessHoursWednesdayIsOpen: store.businessHoursWednesdayIsOpen,
      businessHoursThursdayOpen: store.businessHoursThursdayOpen,
      businessHoursThursdayClose: store.businessHoursThursdayClose,
      businessHoursThursdayIsOpen: store.businessHoursThursdayIsOpen,
      businessHoursFridayOpen: store.businessHoursFridayOpen,
      businessHoursFridayClose: store.businessHoursFridayClose,
      businessHoursFridayIsOpen: store.businessHoursFridayIsOpen,
      businessHoursSaturdayOpen: store.businessHoursSaturdayOpen,
      businessHoursSaturdayClose: store.businessHoursSaturdayClose,
      businessHoursSaturdayIsOpen: store.businessHoursSaturdayIsOpen,
      businessHoursSundayOpen: store.businessHoursSundayOpen,
      businessHoursSundayClose: store.businessHoursSundayClose,
      businessHoursSundayIsOpen: store.businessHoursSundayIsOpen,
      returnPolicy: store.returnPolicy,
      shippingPolicy: store.shippingPolicy,
      rating: store.rating ? Number(store.rating) : 0,
      reviewCount: store.reviewCount,
      productCount: store.productCount,
      followerCount: store.followerCount,
      isVerified: store.isVerified,
      isActive: store.isActive,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
    };
  }
}

