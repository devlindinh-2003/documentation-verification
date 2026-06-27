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
    // 1. Attempt standard list check
    const { data: fileData, error: fileError } = await this.supabase.storage
      .from(this.bucket)
      .list(path.includes('/') ? path.split('/').slice(0, -1).join('/') : '', {
        search: path.split('/').pop(),
      });

    if (!fileError && fileData && fileData.length > 0) {
      const file = fileData[0];
      return {
        size: file.metadata?.size || 0,
        mime: file.metadata?.mimetype || '',
        name: file.name,
      };
    }

    // 2. Fallback: If list returns empty/error (common when RLS SELECT policies are missing
    // for the anon key on a public bucket), fetch metadata via HTTP HEAD request on the public URL.
    try {
      const { data: { publicUrl } } = this.supabase.storage.from(this.bucket).getPublicUrl(path);
      const response = await fetch(publicUrl, { method: 'HEAD' });
      if (response.ok) {
        const size = parseInt(response.headers.get('content-length') || '0', 10);
        const mime = response.headers.get('content-type') || '';
        return {
          size,
          mime,
          name: path.split('/').pop() || path,
        };
      }
    } catch (e) {
      // Ignore and return null below
    }

    return null;
  }

  async getSignedUrl(path: string, expiresIn = 3600) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .createSignedUrl(path, expiresIn);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    } catch (e) {
      // Fallback to public URL below
    }

    // Fallback: If createSignedUrl fails (requires SELECT permission), return public URL
    const { data: { publicUrl } } = this.supabase.storage.from(this.bucket).getPublicUrl(path);
    return publicUrl;
  }
}
