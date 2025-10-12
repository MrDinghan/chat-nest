import mongoose from "mongoose";

export interface MongoBaseFields {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export type DocumentType<T> = mongoose.Document &
  T & {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

export interface DocumentTransformer<
  TDocument extends mongoose.Document,
  TDto
> {
  transform(document: TDocument): TDto;
  transformArray(documents: TDocument[]): TDto[];
}

export class UniversalDocumentTransformer<
  TDocument extends mongoose.Document & {
    _id: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
  },
  TDto extends MongoBaseFields
> implements DocumentTransformer<TDocument, TDto>
{
  private fieldMapper:
    | ((doc: TDocument) => Omit<TDto, keyof MongoBaseFields>)
    | undefined;

  constructor(
    fieldMapper?: (doc: TDocument) => Omit<TDto, keyof MongoBaseFields>
  ) {
    this.fieldMapper = fieldMapper;
  }

  public transform(document: TDocument): TDto {
    const baseFields: MongoBaseFields = {
      _id: document._id.toString(),
      ...(document.createdAt && {
        createdAt: document.createdAt.toISOString(),
      }),
      ...(document.updatedAt && {
        updatedAt: document.updatedAt.toISOString(),
      }),
    };

    const customFields = this.fieldMapper
      ? this.fieldMapper(document)
      : this.extractPlainFields(document);

    return {
      ...customFields,
      ...baseFields,
    } as TDto;
  }

  public transformArray(documents: TDocument[]): TDto[] {
    return documents.map((doc) => this.transform(doc));
  }

  private extractPlainFields(
    document: TDocument
  ): Omit<TDto, keyof MongoBaseFields> {
    const plainObject = document.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, __v, createdAt, updatedAt, ...rest } = plainObject;
    return rest;
  }
}

export function createTransformer<
  TDocument extends mongoose.Document & {
    _id: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
  },
  TDto extends MongoBaseFields
>(fieldMapper?: (doc: TDocument) => Omit<TDto, keyof MongoBaseFields>) {
  return new UniversalDocumentTransformer<TDocument, TDto>(fieldMapper);
}

export function createAutoTransformer<
  TDocument extends mongoose.Document & {
    _id: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
  },
  TDto extends MongoBaseFields
>() {
  return new UniversalDocumentTransformer<TDocument, TDto>();
}
