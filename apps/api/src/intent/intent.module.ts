import { Module } from '@nestjs/common';
import { IntentService } from './intent.service';
import { IntentController } from './intent.controller';

@Module({
  controllers: [IntentController],
  providers: [IntentService],
  exports: [IntentService],
})
export class IntentModule {}
