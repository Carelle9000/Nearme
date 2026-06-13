import { Response } from 'express';
export declare class PhotosController {
    upload(req: any, body: {
        data: string;
        ext: string;
    }): Promise<{
        path: string;
    }>;
    servePhoto(userId: string, filename: string, res: Response): void;
}
