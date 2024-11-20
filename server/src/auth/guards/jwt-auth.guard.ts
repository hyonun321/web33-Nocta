import { Injectable, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "../auth.service";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const token = request.headers.authorization?.split(" ")[1];

    // JWT 토큰 블랙리스트 확인
    if (token && (await this.authService.isTokenBlacklisted(token))) {
      throw new UnauthorizedException("Token is blacklisted");
    }

    const canActivate = (await super.canActivate(context)) as boolean;

    // Access Token의 tokenVersion과 사용자의 tokenVersion 일치 여부 확인
    const decodedToken = this.jwtService.decode(token) as { sub: string; tokenVersion: number };
    const user = await this.authService.findById(decodedToken.sub);

    if (!user || user.tokenVersion !== decodedToken.tokenVersion) {
      throw new UnauthorizedException("Invalid token version");
    }

    return canActivate;
  }
}
