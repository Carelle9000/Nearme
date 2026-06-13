import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { StoreModule } from './store/store.module';
import { AuthModule } from './auth/auth.module';
import { SyncModule } from './sync/sync.module';
import { PhotosModule } from './photos/photos.module';
import { FacesModule } from './faces/faces.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting global (surchargé par @Throttle sur les controllers sensibles)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
    StoreModule,
    AuthModule,
    SyncModule,
    PhotosModule,
    FacesModule,
    ChatModule,
  ],
})
export class AppModule {}
