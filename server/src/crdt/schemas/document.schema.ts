import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type DocumentDocument = Document & Doc;

@Schema()
export class Doc {
  @Prop({ type: Object, required: true })
  crdt: {
    clock: number;
    client: number;
    LinkedList: {
      head: {
        clock: number;
        client: number;
      } | null;
      nodeMap: {
        [key: string]: {
          id: { clock: number; client: number };
          value: string;
          next: { clock: number; client: number } | null;
          prev: { clock: number; client: number } | null;
        };
      };
    };
  };

  @Prop({ default: Date.now })
  updatedAt: Date;
}
export const DocumentSchema = SchemaFactory.createForClass(Doc);
