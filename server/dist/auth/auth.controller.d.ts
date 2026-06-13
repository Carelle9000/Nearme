import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    register(body: any): Promise<{
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
    login(body: {
        email: string;
        password: string;
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
    refresh(body: {
        refresh_token: string;
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
    loginWithGoogle(body: {
        id_token: string;
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
    loginWithApple(body: {
        identity_token: string;
        email?: string;
        name?: string;
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
    forgotPassword(body: {
        email: string;
    }): Promise<{
        message: string;
    }>;
}
