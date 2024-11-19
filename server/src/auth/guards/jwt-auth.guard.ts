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
    let canActivate: boolean;

    // JWT 토큰 블랙리스트 확인
    if (token && (await this.authService.isTokenBlacklisted(token))) {
      throw new UnauthorizedException("Token is blacklisted");
    }

    try {
      // JWT 토큰 유효성 인증
      canActivate = (await super.canActivate(context)) as boolean;
    } catch (error) {
      if (!(error.name === "TokenExpiredError" || request.body.refreshToken)) {
        throw new UnauthorizedException("Invalid access token");
      }

      // Access Token 만료 시 Refresh Token으로 새로운 Access Token 발급
      const { refreshToken } = request.cookies;
      const isValid = await this.authService.validateRefreshToken(refreshToken);

      if (!isValid) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const user = await this.authService.findByRefreshToken(refreshToken);

      const newAccessToken = this.jwtService.sign({ id: user.id, email: user.email });

      // 응답 헤더에 새로운 Access Token 설정
      response.setHeader("Authorization", `Bearer ${newAccessToken}`);

      // 요청 헤더에 새로운 Access Token 설정
      request.headers.authorization = `Bearer ${newAccessToken}`;

      // 새로운 Access Token으로 다시 인증 시도
      return (await super.canActivate(context)) as boolean;
    }

    // Access Token의 tokenVersion과 사용자의 tokenVersion 일치 여부 확인
    const decodedToken = this.jwtService.decode(token) as { sub: string; tokenVersion: number };
    const user = await this.authService.findById(decodedToken.sub);

    if (!user || user.tokenVersion !== decodedToken.tokenVersion) {
      throw new UnauthorizedException("Invalid token version");
    }

    return canActivate;
  }
}
