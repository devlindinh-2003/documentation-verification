import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY')!;
    this.bucket = this.configService.get<string>('SUPABASE_BUCKET')!;

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async createSignedUploadUrl(path: string) {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUploadUrl(path);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to create signed upload URL: ${error.message}`,
      );
    }

    return data;
  }

  async getFileMetadata(path: string) {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .list('', {
        search: path,
      });

    // Supabase 'list' doesn't always return a single object metadata easily by path if it's nested
    // but getMetadata is not available in the public JS SDK as a single call always.
    // However, we can use info or just try to get the public URL/signed URL to check existence.
    // Actually, data from list will contain the file if it exists.
    
    // Better way to get specific file info:
    const { data: fileData, error: fileError } = await this.supabase.storage
      .from(this.bucket)
      .list(path.includes('/') ? path.split('/').slice(0, -1).join('/') : '', {
        search: path.split('/').pop(),
      });

    if (fileError || !fileData || fileData.length === 0) {
      return null;
    }

    const file = fileData[0];
    return {
      size: file.metadata?.size || 0,
      mime: file.metadata?.mimetype || '',
      name: file.name,
    };
  }

  async getSignedUrl(path: string, expiresIn = 3600) {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to create signed URL: ${error.message}`,
      );
    }

    return data.signedUrl;
  }
}
