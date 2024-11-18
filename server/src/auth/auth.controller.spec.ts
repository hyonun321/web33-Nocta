import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "mockNanoId123"),
}));

describe("AuthController", () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(authController).toBeDefined();
  });

  describe("register", () => {
    it("should call authService.register and return the result", async () => {
      const dto = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };
      const mockResult = {
        id: "mockNanoId123",
        email: "test@example.com",
        name: "Test User",
      };
      mockAuthService.register.mockResolvedValue(mockResult);

      const result = await authController.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto.email, dto.password, dto.name);
      expect(result).toEqual(mockResult);
    });
  });
});
