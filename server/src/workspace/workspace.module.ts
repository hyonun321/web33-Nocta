import { Module } from "@nestjs/common";
import { WorkSpaceService } from "./workspace.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Workspace, WorkspaceSchema } from "./schemas/workspace.schema";
import { WorkspaceGateway } from "./workspace.gateway";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: Workspace.name, schema: WorkspaceSchema }]),
  ],
  providers: [WorkSpaceService, WorkspaceGateway],
  exports: [WorkSpaceService],
})
export class WorkspaceModule {}
