import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JobAlertsService } from './job-alerts.service';
import { JobAlertsController } from './job-alerts.controller';
import { JobAlertsProcessor } from './job-alerts.processor';
import { QUEUE_NAMES } from '../queues/queues.constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.ALERTS }),
  ],
  controllers: [JobAlertsController],
  providers: [JobAlertsService, JobAlertsProcessor],
  exports: [JobAlertsService],
})
export class JobAlertsModule {}
