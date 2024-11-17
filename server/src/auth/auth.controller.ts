import { Controller, Post, Body, Request, UseGuards } from "@nestjs/common";
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
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new Error("Invalid credentials");
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("profile")
  getProfile(@Request() req) {
    return req.user;
  }
}
