import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Doc, DocumentDocument } from './schemas/document.schema';
import { Model } from 'mongoose';

@Injectable()
export class EventsService {
  constructor(@InjectModel(Doc.name) private documentModel: Model<DocumentDocument>) {}

  async getDocument(): Promise<Doc> {
    let doc = await this.documentModel.findOne();
    console.log(doc);
    if (!doc) {
      doc = new this.documentModel({ content: '' });
      await doc.save();
    }
    return doc;
  }

  async updateDocument(content: string): Promise<Doc> {
    const doc = await this.documentModel.findOneAndUpdate(
      {},
      { content, updatedAt: new Date() },
      { new: true, upsert: true },
    );
    return doc;
  }
}
