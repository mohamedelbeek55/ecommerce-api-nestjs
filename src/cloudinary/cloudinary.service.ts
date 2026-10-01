import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
    constructor(private readonly configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.getOrThrow<string>(
                'CLOUDINARY_CLOUD_NAME',
            ),
            api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.getOrThrow<string>(
                'CLOUDINARY_API_SECRET',
            ),
        });
    }

    async uploadImage(
        file: { buffer: Buffer },
    ): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'ecommerce/products',
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    if (!result) {
                        reject(new Error('Cloudinary upload failed'));
                        return;
                    }

                    resolve(result);
                },
            );

            uploadStream.end(file.buffer);
        });
    }

    async deleteImage(publicId: string): Promise<void> {
        await cloudinary.uploader.destroy(publicId);
    }
}