import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserController } from './user/user.controller';
import { EventsModule } from './events/events.module';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost:27017'), EventsModule],
  controllers: [AppController, UserController],
  providers: [AppService],
})
export class AppModule {}
