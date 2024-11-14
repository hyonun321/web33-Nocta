import { Test, TestingModule } from "@nestjs/testing";
import { MongooseModule } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { AppModule } from "./app.module";

jest.setTimeout(20000);

describe("AppModule MongoDB Connection", () => {
  beforeAll(async () => {
    // jest-mongodb가 설정한 MONGO_URL을 MONGO_URI로 설정
    process.env.MONGO_URI = process.env.MONGO_URL;
    console.log(`MONGO_URI: ${process.env.MONGO_URI}`);

    await mongoose.connect(process.env.MONGO_URI);

    const module: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(process.env.MONGO_URI), AppModule],
    }).compile();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should connect to the MongoDB instance provided by jest-mongodb", async () => {
    expect(mongoose.connection.readyState).toBe(1);
  });
});
