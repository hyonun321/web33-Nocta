import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { getModelToken } from "@nestjs/mongoose";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { nanoid } from "nanoid";

jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "mockNanoId123"),
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(() => Promise.resolve("hashedPassword123")),
  compare: jest.fn(() => Promise.resolve(true)),
}));

describe("AuthService", () => {
  let authService: AuthService;
  let userModel: any;
  let jwtService: JwtService;

  const mockUserModel = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken("User"), useValue: mockUserModel },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken("User"));
    jwtService = module.get<JwtService>(JwtService);
  });

  it("should be defined", () => {
    expect(authService).toBeDefined();
  });

  describe("register", () => {
    it("should create a new user with a nanoid as id", async () => {
      // nanoid mock 설정
      const mockId = "mockNanoId123";
      (nanoid as jest.Mock).mockReturnValue(mockId);

      const hashedPassword = "hashedPassword123";
      jest.spyOn(bcrypt, "hash").mockResolvedValue(hashedPassword);

      const mockUser = {
        id: mockId,
        email: "test@example.com",
        password: hashedPassword,
        name: "Test User",
      };

      userModel.create.mockResolvedValue(mockUser);

      const result = await authService.register("test@example.com", "password123", "Test User");

      expect(nanoid).toHaveBeenCalled(); // nanoid 호출 확인
      expect(userModel.create).toHaveBeenCalledWith({
        id: mockId,
        email: "test@example.com",
        password: hashedPassword,
        name: "Test User",
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe("validateUser", () => {
    it("should return the user if credentials are valid", async () => {
      const mockUser = {
        id: "mockNanoId123",
        email: "test@example.com",
        password: "hashedPassword123",
      };
      userModel.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

      const result = await authService.validateUser("test@example.com", "password123");

      expect(userModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(result).toEqual(mockUser);
    });

    it("should return null if credentials are invalid", async () => {
      userModel.findOne.mockResolvedValue(null);

      const result = await authService.validateUser("test@example.com", "password123");

      expect(result).toBeNull();
    });
  });

  describe("login", () => {
    it("should return a JWT token", async () => {
      const mockUser = { id: "mockNanoId123", email: "test@example.com" };
      mockJwtService.sign.mockReturnValue("mockJwtToken");

      const result = await authService.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({ accessToken: "mockJwtToken" });
    });
  });
});
