import { ENV } from '../config/env';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset: string;
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  format?: string;
  width?: number;
  height?: number;
}

/**
 * Pure TypeScript SHA-1 implementation for signing Cloudinary upload parameters
 */
function sha1(message: string): string {
  function rotateLeft(n: number, s: number): number {
    return (n << s) | (n >>> (32 - s));
  }

  const utf8 = unescape(encodeURIComponent(message));
  const words: number[] = [];
  const msgLen = utf8.length;

  for (let i = 0; i < msgLen - 3; i += 4) {
    const j =
      (utf8.charCodeAt(i) << 24) |
      (utf8.charCodeAt(i + 1) << 16) |
      (utf8.charCodeAt(i + 2) << 8) |
      utf8.charCodeAt(i + 3);
    words.push(j);
  }

  let i = 0;
  switch (msgLen % 4) {
    case 0:
      i = 0x080000000;
      break;
    case 1:
      i = (utf8.charCodeAt(msgLen - 1) << 24) | 0x0800000;
      break;
    case 2:
      i = (utf8.charCodeAt(msgLen - 2) << 24) | (utf8.charCodeAt(msgLen - 1) << 16) | 0x08000;
      break;
    case 3:
      i =
        (utf8.charCodeAt(msgLen - 3) << 24) |
        (utf8.charCodeAt(msgLen - 2) << 16) |
        (utf8.charCodeAt(msgLen - 1) << 8) |
        0x80;
      break;
  }
  words.push(i);

  while (words.length % 16 !== 14) {
    words.push(0);
  }

  words.push(msgLen >>> 29);
  words.push((msgLen << 3) & 0x0ffffffff);

  let H0 = 0x67452301;
  let H1 = 0xefcdab89;
  let H2 = 0x98badcfe;
  let H3 = 0x10325476;
  let H4 = 0xc3d2e1f0;

  const W = new Array<number>(80);

  for (let blockstart = 0; blockstart < words.length; blockstart += 16) {
    for (let t = 0; t < 16; t++) {
      W[t] = words[blockstart + t];
    }
    for (let t = 16; t < 80; t++) {
      W[t] = rotateLeft(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    }

    let A = H0;
    let B = H1;
    let C = H2;
    let D = H3;
    let E = H4;

    for (let t = 0; t < 80; t++) {
      let temp: number;
      if (t < 20) {
        temp = (rotateLeft(A, 5) + ((B & C) | (~B & D)) + E + W[t] + 0x5a827999) & 0x0ffffffff;
      } else if (t < 40) {
        temp = (rotateLeft(A, 5) + (B ^ C ^ D) + E + W[t] + 0x6ed9eba1) & 0x0ffffffff;
      } else if (t < 60) {
        temp =
          (rotateLeft(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[t] + 0x8f1bbcdc) &
          0x0ffffffff;
      } else {
        temp = (rotateLeft(A, 5) + (B ^ C ^ D) + E + W[t] + 0xca62c1d6) & 0x0ffffffff;
      }
      E = D;
      D = C;
      C = rotateLeft(B, 30);
      B = A;
      A = temp;
    }

    H0 = (H0 + A) & 0x0ffffffff;
    H1 = (H1 + B) & 0x0ffffffff;
    H2 = (H2 + C) & 0x0ffffffff;
    H3 = (H3 + D) & 0x0ffffffff;
    H4 = (H4 + E) & 0x0ffffffff;
  }

  const toHex = (val: number): string => {
    let str = '';
    for (let idx = 7; idx >= 0; idx--) {
      str += ((val >>> (idx * 4)) & 0x0f).toString(16);
    }
    return str;
  };

  return (toHex(H0) + toHex(H1) + toHex(H2) + toHex(H3) + toHex(H4)).toLowerCase();
}

/**
 * CloudinaryService handles parsing CLOUDINARY_URL (cloudinary://<api_key>:<api_secret>@swsqjk22)
 * and uploading driver profile pictures and driving license images (front & back) to Cloudinary.
 */
class CloudinaryService {
  parseConfig(): CloudinaryConfig {
    const rawUrl = ENV.CLOUDINARY_URL || 'cloudinary://<your_api_key>:<your_api_secret>@swsqjk22';
    const match = rawUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);

    if (match) {
      return {
        apiKey: match[1].trim(),
        apiSecret: match[2].trim(),
        cloudName: match[3].trim(),
        uploadPreset: ENV.CLOUDINARY_UPLOAD_PRESET,
      };
    }

    return {
      cloudName: 'swsqjk22',
      apiKey: '',
      apiSecret: '',
      uploadPreset: ENV.CLOUDINARY_UPLOAD_PRESET,
    };
  }

  private async uploadToFolder(
    imageUri: string,
    folder: string,
    filename: string
  ): Promise<CloudinaryUploadResult> {
    const config = this.parseConfig();
    const cloudName = config.cloudName || 'swsqjk22';
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const hasRealCredentials =
      Boolean(config.apiKey) &&
      Boolean(config.apiSecret) &&
      !config.apiKey.includes('<your_api_key>') &&
      !config.apiSecret.includes('<your_api_secret>');

    const formData = new FormData();

    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: filename,
    } as any);

    formData.append('folder', folder);

    if (hasRealCredentials) {
      const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
      const signature = sha1(`${paramsToSign}${config.apiSecret}`);

      formData.append('api_key', config.apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
    } else {
      formData.append('upload_preset', config.uploadPreset || 'ml_default');
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          secureUrl: data.secure_url || data.url,
          publicId: data.public_id,
          format: data.format,
          width: data.width,
          height: data.height,
        };
      } else {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `Status ${response.status}`;

        if (!hasRealCredentials) {
          console.warn(
            `[Cloudinary swsqjk22] Placeholder credentials detected (${errMsg}). Using local image preview until real API key & secret are set in .env.`
          );
          return {
            secureUrl: imageUri,
            publicId: `${folder}/${filename}`,
          };
        }

        throw new Error(`Cloudinary upload failed: ${errMsg}`);
      }
    } catch (error: any) {
      if (!hasRealCredentials) {
        return {
          secureUrl: imageUri,
          publicId: `${folder}/${filename}`,
        };
      }
      throw error;
    }
  }

  /**
   * Uploads a driver license verification photo (front or back) to Cloudinary (swsqjk22)
   */
  async uploadLicenseImage(
    imageUri: string,
    side: 'front' | 'back',
    driverId?: string
  ): Promise<CloudinaryUploadResult> {
    const filename = `license_${side}_${driverId || Date.now()}.jpg`;
    return this.uploadToFolder(imageUri, 'yamu_driver_licenses', filename);
  }

  /**
   * Uploads a driver user profile photo to Cloudinary (swsqjk22)
   */
  async uploadProfileImage(
    imageUri: string,
    userId?: string
  ): Promise<CloudinaryUploadResult> {
    const filename = `driver_avatar_${userId || Date.now()}.jpg`;
    return this.uploadToFolder(imageUri, 'yamu_driver_profiles', filename);
  }
}

export const cloudinaryService = new CloudinaryService();
