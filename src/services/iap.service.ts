import RNIap, {
  Product,
  PurchaseError,
  acknowledgePurchaseAndroid,
  getAvailablePurchases,
  getSubscriptions,
  requestSubscription,
  finishTransaction,
  initConnection,
  endConnection,
} from 'react-native-iap';
import { functions } from '@/config/firebase';
import { httpsCallable } from 'firebase/functions';
import { Alert } from 'react-native';

const PRODUCT_ID = 'com.nearme.app.premium.monthly';

interface IapServiceCallbacks {
  onPurchaseUpdated?: (purchase: any) => void;
  onPurchaseError?: (error: PurchaseError) => void;
}

class IapService {
  private isConnected = false;
  private updateSubscription: any = null;
  private errorSubscription: any = null;
  private validateGooglePlayPurchase = httpsCallable(functions, 'validateGooglePlayPurchase');

  async initConnection(): Promise<void> {
    try {
      if (this.isConnected) return;
      await initConnection();
      this.isConnected = true;

      this.setupListeners();
    } catch (err) {
      console.error('Failed to init IAP connection:', err);
    }
  }

  async endConnection(): Promise<void> {
    try {
      if (this.updateSubscription) this.updateSubscription.remove();
      if (this.errorSubscription) this.errorSubscription.remove();
      if (this.isConnected) {
        await endConnection();
        this.isConnected = false;
      }
    } catch (err) {
      console.error('Failed to end IAP connection:', err);
    }
  }

  private setupListeners(): void {
    if (this.updateSubscription) return;

    this.updateSubscription = RNIap.purchaseUpdatedListener(async (purchase: any) => {
      await this.handlePurchaseUpdate(purchase);
    });

    this.errorSubscription = RNIap.purchaseErrorListener((error: PurchaseError) => {
      if (error.code === 'E_USER_CANCELLED') {
        console.log('User cancelled purchase');
      } else {
        console.error('Purchase error:', error.message);
        Alert.alert('Erreur', 'L\'achat a échoué. Veuillez réessayer.');
      }
    });
  }

  private async handlePurchaseUpdate(purchase: any): Promise<void> {
    try {
      if (purchase.purchaseStateAndroid === 1) {
        await this.validateAndActivate(purchase);
        await acknowledgePurchaseAndroid({ token: purchase.purchaseToken, packageName: 'com.nearme.app' });
      } else if (purchase.purchaseStateAndroid === 0) {
        console.log('Purchase pending:', purchase);
      }
    } catch (err) {
      console.error('Error handling purchase update:', err);
    }
  }

  async getSubscriptionDetails(): Promise<Product | undefined> {
    try {
      const products = await getSubscriptions({ skus: [PRODUCT_ID] });
      return products[0];
    } catch (err) {
      console.error('Failed to get subscription details:', err);
      return undefined;
    }
  }

  async purchaseSubscription(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.initConnection();
      }

      await requestSubscription({ sku: PRODUCT_ID, andDangerouslyFinishTransactionAutomaticallyIOS: false });
    } catch (err) {
      if (err instanceof PurchaseError) {
        if (err.code !== 'E_USER_CANCELLED') {
          throw new Error(`Erreur d'achat: ${err.message}`);
        }
      } else {
        throw err;
      }
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.initConnection();
      }

      const purchases = await getAvailablePurchases();
      let restored = false;

      for (const purchase of purchases) {
        if (purchase.productId === PRODUCT_ID) {
          await this.validateAndActivate(purchase);
          restored = true;
        }
      }

      if (!restored) {
        Alert.alert('Info', 'Aucun achat trouvé à restaurer.');
      }

      return restored;
    } catch (err) {
      console.error('Failed to restore purchases:', err);
      Alert.alert('Erreur', 'Impossible de restaurer les achats.');
      throw err;
    }
  }

  private async validateAndActivate(purchase: any): Promise<void> {
    try {
      const result = await this.validateGooglePlayPurchase({
        purchaseToken: purchase.purchaseToken,
        productId: purchase.productId,
      }) as any;

      if (result.data?.success) {
        await finishTransaction({ purchase, isConsumable: false });
      } else {
        throw new Error('Validation failed');
      }
    } catch (err) {
      console.error('Failed to validate purchase:', err);
      await finishTransaction({ purchase, isConsumable: false });
      throw new Error('La validation du paiement a échoué. Veuillez contacter le support.');
    }
  }
}

export const iapService = new IapService();
