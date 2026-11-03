import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DbService } from './db.service';
import { WorkerService } from './worker.service';

@Module({
  controllers: [AppController],
  providers: [DbService, WorkerService],
})
export class AppModule {}
