import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient;
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;
  private readonly supabaseServiceRoleKey: string;

  constructor(private configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>('supabase.url') || '';
    this.supabaseAnonKey = this.configService.get<string>('supabase.anonKey') || '';
    this.supabaseServiceRoleKey = this.configService.get<string>('supabase.serviceRoleKey') || '';
  }

  async onModuleInit() {
    try {
      if (!this.supabaseUrl || !this.supabaseAnonKey) {
        this.logger.warn(
          'Supabase URL or Anon Key not configured. Supabase features will be disabled.',
        );
        return;
      }

      this.client = createClient(this.supabaseUrl, this.supabaseAnonKey, {
        auth: {
          persistSession: false,
        },
      });

      // Test connection
      await this.testConnection();
      this.logger.log('Supabase connection established successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Supabase client', error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error('Supabase client not initialized');
      }

      // Simple query to test connection
      const { error } = await this.client.from('users').select('count').limit(1);

      if (error) {
        // If table doesn't exist, that's okay - connection is working
        if (
          error.code === 'PGRST116' ||
          error.message.includes('relation') ||
          error.message.includes('does not exist')
        ) {
          this.logger.log('Supabase connection successful (table may not exist yet)');
          return true;
        }
        throw error;
      }

      this.logger.log('Supabase connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Supabase connection test failed', error);
      return false;
    }
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Check your configuration.');
    }
    return this.client;
  }

  getServiceRoleClient(): SupabaseClient {
    if (!this.supabaseUrl || !this.supabaseServiceRoleKey) {
      throw new Error('Supabase service role key not configured');
    }
    return createClient(this.supabaseUrl, this.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }
}
