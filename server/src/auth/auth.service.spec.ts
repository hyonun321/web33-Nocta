import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { JwtService } from "@nestjs/jwt";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";

// Mock modules
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashedPassword"),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock("nanoid", () => ({
  nanoid: () => "mockNanoId123",
}));

const bcrypt = require("bcrypt");

describe("AuthService", () => {
  let service: AuthService;
  let userModel: Model<UserDocument>;
  let jwtService: JwtService;

  const mockUser = {
    id: "mockNanoId123",
    email: "test@example.com",
    password: "hashedPassword",
    name: "Test User",
  };

  // Updated mockUserModel
  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue("test-token"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should create a new user with hashed password", async () => {
      const dto = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      mockUserModel.create.mockResolvedValue(mockUser);

      const result = await service.register(dto.email, dto.password, dto.name);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(mockUserModel.create).toHaveBeenCalledWith({
        email: dto.email,
        password: "hashedPassword",
        name: dto.name,
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw an error if user creation fails", async () => {
      const dto = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      mockUserModel.create.mockRejectedValue(new Error("Database error"));

      await expect(service.register(dto.email, dto.password, dto.name)).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("validateUser", () => {
    it("should return user if email and password are valid", async () => {
      const dto = {
        email: "test@example.com",
        password: "password123",
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValueOnce(true);

      const result = await service.validateUser(dto.email, dto.password);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: dto.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, mockUser.password);
      expect(result).toEqual(mockUser);
    });

    it("should return null if user is not found", async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await service.validateUser("wrong@email.com", "password123");

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "wrong@email.com" });
      expect(result).toBeNull();
    });

    it("should return null if password is invalid", async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValueOnce(false);

      const result = await service.validateUser("test@example.com", "wrongpassword");

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(bcrypt.compare).toHaveBeenCalledWith("wrongpassword", mockUser.password);
      expect(result).toBeNull();
    });
  });

  describe("login", () => {
    it("should return JWT token", async () => {
      const user = {
        id: "mockNanoId123",
        email: "test@example.com",
      };

      const result = await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
      });
      expect(result).toEqual({ accessToken: "test-token" });
    });
  });
});
