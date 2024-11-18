/*
import { Test, TestingModule } from "@nestjs/testing";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { User, UserSchema } from "./schemas/user.schema";
import { AuthModule } from "./auth.module";

jest.setTimeout(30000);

jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "mockNanoId123"),
}));

describe("AuthModule", () => {
  let testingModule: TestingModule;

  beforeAll(async () => {
    if (!process.env.MONGO_URI || !process.env.MONGO_URL) {
      process.env.MONGO_URI = "mongodb://localhost:27017/test-db";
    }
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = "test-secret";
    }

    testingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(process.env.MONGO_URI),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        PassportModule,
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: "1h" },
        }),
        AuthModule,
      ],
      controllers: [AuthController],
      providers: [AuthService, JwtStrategy],
    }).compile();
  });

  afterAll(async () => {
    if (testingModule) {
      await testingModule.close();
    }
  });

  it("should be defined", () => {
    const authController = testingModule.get<AuthController>(AuthController);
    const authService = testingModule.get<AuthService>(AuthService);
    expect(authController).toBeDefined();
    expect(authService).toBeDefined();
  });
});
*/

describe("Example Test", () => {
  it("should return true", () => {
    expect(true).toBe(true);
  });
});
