import { functions } from '@/config/firebase';
import { httpsCallable } from 'firebase/functions';

interface PurchaseError {
  code: string;
  message: string;
}

interface IapServiceCallbacks {
  onPurchaseUpdated?: (purchase: any) => void;
  onPurchaseError?: (error: PurchaseError) => void;
}

class IapService {
  private isConnected = false;
  private validateGooglePlayPurchase = httpsCallable(functions, 'validateGooglePlayPurchase');

  async initConnection(): Promise<void> {
    // Web doesn't support in-app purchases through native IAP
    this.isConnected = true;
  }

  async endConnection(): Promise<void> {
    this.isConnected = false;
  }

  private setupListeners(): void {
    // No-op on web
  }

  requestSubscription(sku: string): Promise<void> {
    console.warn('In-app purchases not available on web');
    return Promise.reject(new Error('In-app purchases not available on web'));
  }

  async getSubscriptions(skus: string[]): Promise<any[]> {
    console.warn('Subscriptions not available on web');
    return [];
  }

  async getAvailablePurchases(): Promise<any[]> {
    console.warn('Purchase history not available on web');
    return [];
  }

  async finishTransaction(purchase: any): Promise<void> {
    // No-op on web
  }

  async acknowledgePurchaseAndroid(token: string): Promise<void> {
    // No-op on web
  }

  async validatePurchase(purchase: any): Promise<any> {
    try {
      const result = await this.validateGooglePlayPurchase({
        packageName: purchase.packageName,
        productId: purchase.productId,
        token: purchase.purchaseToken,
      });
      return result.data;
    } catch (err) {
      console.error('Purchase validation failed:', err);
      throw err;
    }
  }
}

export const iapService = new IapService();
