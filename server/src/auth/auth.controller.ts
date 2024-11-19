import { Controller, Post, Body, Request, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from "@nestjs/swagger";
import { UserDto } from "./dto/user.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string" },
        password: { type: "string" },
        name: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "The user has been successfully created.",
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  async register(
    @Body() body: { email: string; password: string; name: string },
  ): Promise<UserDto> {
    const { email, password, name } = body;
    const user = await this.authService.register(email, password, name);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  @Post("login")
  @ApiOperation({ summary: "Login a user" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string" },
        password: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 200, description: "The user has been successfully logged in." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new Error("Invalid credentials");
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("profile")
  @ApiOperation({ summary: "Get user profile" })
  @ApiResponse({ status: 200, description: "The user profile has been successfully retrieved." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getProfile(@Request() req) {
    return req.user;
  }
}
