import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Doc, DocumentSchema } from './schemas/document.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Doc.name, schema: DocumentSchema }])],
  providers: [EventsGateway, EventsService],
  exports: [EventsService],
})
export class EventsModule {}
