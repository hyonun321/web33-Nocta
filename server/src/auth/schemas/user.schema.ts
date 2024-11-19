import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { nanoid } from "nanoid";

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true, default: () => nanoid() })
  id: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  // TODO refresh token
}

export const UserSchema = SchemaFactory.createForClass(User);
