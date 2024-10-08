import { Module, forwardRef } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users/users.module';
import { GiftsModule } from './gifts/gifts.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { RegistriesModule } from './registries/registries.module';
import { GroupsModule } from './groups/groups.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    AuthModule,
    // GiftsModule,
    
    forwardRef(() => DatabaseModule),
    forwardRef(() => GiftsModule),
    forwardRef(() => EventsModule), 
    forwardRef(() => RegistriesModule),
    forwardRef(() => GroupsModule),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
