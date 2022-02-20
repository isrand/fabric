import { Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './configurations/config';
import { InvokeModule } from './invoke/invoke.module';
import { QueryModule } from './query/query.module';

@Module({
  imports: [
    QueryModule,
    InvokeModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
  ],
})
export class AppModule implements NestModule {
  configure() {}
}
