import { StoreService, ProfileRecord } from '../store/store.service';
export declare class AuthService {
    private readonly store;
    constructor(store: StoreService);
    issueAccessToken(userId: string, email: string): string;
    private issueRefreshToken;
    register(body: {
        name: string;
        email: string;
        password: string;
        gender?: string;
        heightCm?: number;
        bio?: string;
        intention?: string;
        location?: string;
        interests?: string[];
    }): Promise<{
        user_id: string;
        email: string;
        access_token: string;
        refresh_token: string;
        profile: {
            id: string;
            user_id: string;
            name: string;
            gender: string | null | undefined;
            height_cm: number | null | undefined;
            bio: string | null | undefined;
            intention: string | null | undefined;
            location: string | null | undefined;
            interests: any;
            photos: any;
            is_face_verified: boolean;
            updated_at: string;
        } | null;
    }>;
    login(email: string, password: string): Promise<{
        user_id: string;
        email: string;
        access_token: string;
        refresh_token: string;
        profile: {
            id: string;
            user_id: string;
            name: string;
            gender: string | null | undefined;
            height_cm: number | null | undefined;
            bio: string | null | undefined;
            intention: string | null | undefined;
            location: string | null | undefined;
            interests: any;
            photos: any;
            is_face_verified: boolean;
            updated_at: string;
        } | null;
    }>;
    refresh(oldToken: string): Promise<{
        user_id: string;
        email: string;
        access_token: string;
        refresh_token: string;
        profile: {
            id: string;
            user_id: string;
            name: string;
            gender: string | null | undefined;
            height_cm: number | null | undefined;
            bio: string | null | undefined;
            intention: string | null | undefined;
            location: string | null | undefined;
            interests: any;
            photos: any;
            is_face_verified: boolean;
            updated_at: string;
        } | null;
    }>;
    loginWithGoogle(idToken: string): Promise<{
        user_id: string;
        email: string;
        access_token: string;
        refresh_token: string;
        profile: {
            id: string;
            user_id: string;
            name: string;
            gender: string | null | undefined;
            height_cm: number | null | undefined;
            bio: string | null | undefined;
            intention: string | null | undefined;
            location: string | null | undefined;
            interests: any;
            photos: any;
            is_face_verified: boolean;
            updated_at: string;
        } | null;
    }>;
    loginWithApple(identityToken: string, emailHint?: string, name?: string): Promise<{
        user_id: string;
        email: string;
        access_token: string;
        refresh_token: string;
        profile: {
            id: string;
            user_id: string;
            name: string;
            gender: string | null | undefined;
            height_cm: number | null | undefined;
            bio: string | null | undefined;
            intention: string | null | undefined;
            location: string | null | undefined;
            interests: any;
            photos: any;
            is_face_verified: boolean;
            updated_at: string;
        } | null;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    private findOrCreateOAuthUser;
    private buildTokenResponse;
    serializeProfile(p: ProfileRecord): {
        id: string;
        user_id: string;
        name: string;
        gender: string | null | undefined;
        height_cm: number | null | undefined;
        bio: string | null | undefined;
        intention: string | null | undefined;
        location: string | null | undefined;
        interests: any;
        photos: any;
        is_face_verified: boolean;
        updated_at: string;
    };
}
