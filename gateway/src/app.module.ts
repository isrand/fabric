import { Module, NestModule } from '@nestjs/common';
import { InvokeModule } from './invoke/invoke.module';
import { QueryModule } from './query/query.module';

@Module({
  imports: [
    InvokeModule,
    QueryModule
  ],
})
export class AppModule implements NestModule {
  configure() {}
}
