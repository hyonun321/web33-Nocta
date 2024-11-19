import { Controller, Post, Body, UseGuards, Req, Res, Request } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  async register(@Body() body: { email: string; password: string; name: string }) {
    const { email, password, name } = body;
    const user = await this.authService.register(email, password, name);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  @Post("login")
  async login(@Body() body: { email: string; password: string }, @Res({ passthrough: true }) res) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new Error("Invalid credentials");
    }
    return this.authService.login(user, res);
  }

  @Post("logout")
  // TODO access token 검증 과정....
  @UseGuards(JwtAuthGuard)
  public async logout(@Req() req) {
    const { user } = req;
    // DB에서 refresh token 삭제
    await this.authService.removeRefreshToken(user);
    // 쿠키 삭제
    this.authService.clearCookie(req.res);
    return {};
  }

  // @Post("refresh")
  // TODO access token 검증 과정
  // TODO refresh token을 이용해서 access token 재발급

  @UseGuards(JwtAuthGuard)
  @Post("profile")
  getProfile(@Req() req) {
    return req.user;
  }
}
