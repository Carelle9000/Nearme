import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

interface FaceComparisonResult {
  confidence: number;
  isMatch: boolean;
}

class FaceCompareService {
  private readonly MATCH_THRESHOLD = 80;

  async compareProfilePhoto(
    userId: string,
    basePhotoUrl: string,
    comparePhotoUrl: string
  ): Promise<FaceComparisonResult> {
    try {
      const compareFaces = httpsCallable(functions, 'compareFaces');
      const result = await compareFaces({
        userId,
        image1Url: basePhotoUrl,
        image2Url: comparePhotoUrl,
      });

      const confidence = (result.data as any).confidence || 0;
      const isMatch = confidence >= this.MATCH_THRESHOLD;

      return { confidence, isMatch };
    } catch (error) {
      console.error('Error comparing faces:', error);
      throw error;
    }
  }

  async verifyFaceWithSelfie(userId: string, profilePhotoUrl: string, selfieUri: string): Promise<boolean> {
    try {
      const verifySelfie = httpsCallable(functions, 'verifySelfieAgainstProfile');
      const result = await verifySelfie({
        userId,
        profilePhotoUrl,
        selfieUri,
      });

      return (result.data as any).verified;
    } catch (error) {
      console.error('Error verifying selfie:', error);
      throw error;
    }
  }
}

export const faceCompareService = new FaceCompareService();
