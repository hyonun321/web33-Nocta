import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./schemas/user.schema";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtRefreshTokenStrategy } from "./strategies/jwt-refresh-token.strategy";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtRefreshTokenAuthGuard } from "./guards/jwt-refresh-token-auth.guard";
import { BlacklistedToken, BlacklistedTokenSchema } from "./schemas/blacklisted-token.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: BlacklistedToken.name, schema: BlacklistedTokenSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "1h" },
      }),
    }),
  ],
  exports: [AuthService, JwtModule],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshTokenStrategy,
    JwtAuthGuard,
    JwtRefreshTokenAuthGuard,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
