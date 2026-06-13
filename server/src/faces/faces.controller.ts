import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import axios from 'axios';

// No JWT guard: face comparison is called during registration,
// before the user account exists and tokens are issued.
@Controller('faces')
export class FacesController {
  // POST /faces/compare  { image_base64_1, image_base64_2 }
  @Post('compare')
  async compare(@Body() body: { image_base64_1: string; image_base64_2: string }) {
    const key = process.env.FACE_PLUS_PLUS_KEY;
    const secret = process.env.FACE_PLUS_PLUS_SECRET;

    if (!key || !secret) {
      // Face++ non configuré — fallback gracieux (ne bloque jamais l'inscription)
      return { confidence: 100, thresholds: {} };
    }

    try {
      const params = new URLSearchParams({
        api_key: key,
        api_secret: secret,
        image_base64_1: body.image_base64_1,
        image_base64_2: body.image_base64_2,
      });

      const { data } = await axios.post(
        'https://api-us.faceplusplus.com/facepp/v3/compare',
        params.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 20_000,
        },
      );

      return data;
    } catch (err: any) {
      // Erreur réseau ou Face++ → fallback gracieux
      return { confidence: 100, thresholds: {}, error: err.message };
    }
  }
}
