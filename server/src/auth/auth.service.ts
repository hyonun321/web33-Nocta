import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { Response } from "express";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.userModel.create({
      email,
      password: hashedPassword,
      name,
    });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  private generateAccessToken(payload: { sub: string; email: string }): string {
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(payload: { sub: string; email: string }): string {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: "7d",
    });
  }

  async login(user: { id: string; name: string; email: string }, res: Response) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return {
      id: user.id,
      name: user.name,
      accessToken,
    };
  }

  // access 검증 과정
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    // Refresh Token 검증
    // TODO db에 저장된 refresh token과 비교

    // TODO 새로운 Access Token 발급
    const newAccessToken = this.generateAccessToken({
      sub: "",
      email: "",
    });

    return {
      accessToken: newAccessToken,
    };
  }

  public async removeRefreshToken(user: User) {
    // TODO DB에 저장된 Refresh Token 삭제
  }

  public clearCookie(res: Response): void {
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
  }
}
