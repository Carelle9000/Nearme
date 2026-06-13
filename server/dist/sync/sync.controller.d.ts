import { SyncService } from './sync.service';
export declare class SyncController {
    private readonly sync;
    constructor(sync: SyncService);
    push(req: any, body: any): {
        ok: boolean;
        synced_at: string;
    };
    pull(req: any, lastSyncStr?: string): {
        profiles: {
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
        }[];
        likes: {
            id: string;
            from_user_id: string;
            to_user_id: string;
            super_like: boolean;
            updated_at: string;
        }[];
        matches: {
            id: string;
            user_id_1: string;
            user_id_2: string;
            matched_at: string;
            updated_at: string;
        }[];
        messages: {
            id: string;
            match_id: string;
            sender_id: string;
            text: string;
            sent_at: string;
            read_at: string | null;
            updated_at: string;
        }[];
        shared_spots: {
            id: string;
            user_id: string;
            name: string;
            lat: number | null | undefined;
            lng: number | null | undefined;
            visited_at: string;
            updated_at: string;
        }[];
        pulled_at: string;
    };
}
