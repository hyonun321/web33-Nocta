import { MongoMemoryServer } from "mongodb-memory-server";
import { Test, TestingModule } from "@nestjs/testing";
import { MongooseModule } from "@nestjs/mongoose";
import { AppModule } from "./app.module";

jest.setTimeout(20000);

describe("MongoDB Connection", () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
      },
    });
    const uri = mongoServer.getUri();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri), // in-memory MongoDB URI
        AppModule,
      ],
    }).compile();
  });

  afterAll(async () => {
    if (mongoServer) await mongoServer.stop();
  });

  it("should connect to MongoDB successfully", () => {
    expect(true).toBe(true); // 실제 테스트 로직 작성
  });
});
