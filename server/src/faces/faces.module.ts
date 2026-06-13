import { Module } from '@nestjs/common';
import { FacesController } from './faces.controller';

@Module({ controllers: [FacesController] })
export class FacesModule {}
