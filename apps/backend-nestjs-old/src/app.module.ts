import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrmModule } from './crm/crm.module';
import { WorkflowModule } from './workflow/workflow.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [CrmModule, WorkflowModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
