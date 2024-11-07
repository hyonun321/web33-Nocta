import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DocumentDocument = Document & Doc;

@Schema()
export class Doc {
  @Prop({
    required: true,
    validate: {
      validator: (value: string) => value !== null && value !== undefined,
      message: 'content 필드는 필수입니다.',
    },
  })
  content: string;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(Doc);
