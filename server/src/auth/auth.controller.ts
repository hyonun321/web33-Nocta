import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Response,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { Response as ExpressResponse, Request as ExpressRequest } from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from "@nestjs/swagger";
import { UserDto } from "./dto/user.dto";
import { JwtRefreshTokenAuthGuard } from "./guards/jwt-refresh-token-auth.guard";

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
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 409, description: "Conflict: Email already exists" })
  async register(@Body() body: { email: string; password: string; name: string }): Promise<void> {
    const { email, password, name } = body;

    const existingUser = await this.authService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    await this.authService.register(email, password, name);
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
  async login(
    @Body() body: { email: string; password: string },
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<UserDto> {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.authService.login(user, res);
  }

  @UseGuards(JwtAuthGuard)
  @Get("logout")
  @ApiOperation({ summary: "Logout a user" })
  @ApiBearerAuth()
  @ApiCookieAuth("refreshToken")
  @ApiResponse({ status: 200, description: "The user has been successfully logged out." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async logout(@Request() req: ExpressRequest): Promise<void> {
    const { user } = req;
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // DB에서 refresh token 삭제
    await this.authService.removeRefreshToken(user.id);

    // TODO access token 블랙리스트 추가
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException("Authorization header not found");
    }
    const [, token] = authHeader.split(" ");
    if (!token) {
      throw new UnauthorizedException("Token not found");
    }
    this.authService.blacklistToken(token, new Date());

    // 쿠키 삭제
    this.authService.clearCookie(req.res);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  @ApiOperation({ summary: "Get user profile" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "The user profile has been successfully retrieved." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getProfile(@Request() req: ExpressRequest): Promise<UserDto> {
    const user = await this.authService.getProfile(req.user.id);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  @UseGuards(JwtRefreshTokenAuthGuard)
  @Get("refresh")
  @ApiOperation({ summary: "Refresh access token" })
  @ApiCookieAuth("refreshToken")
  @ApiResponse({ status: 200, description: "The access token has been successfully refreshed." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async refresh(@Request() req: ExpressRequest) {
    return this.authService.refresh(req.cookies.refreshToken);
  }
}
