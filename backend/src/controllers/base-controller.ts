import mongoose from "mongoose";
import { Controller } from "tsoa";

import { DocumentTransformer } from "@/utils/document-transformer";

export class BaseController extends Controller {
  protected success<T>(data: T, message = "Success", code = 200) {
    this.setStatus(code);
    return { code, message, data };
  }

  protected fail(message: string, code = 400, data: any = null) {
    this.setStatus(code);
    return { code, message, data };
  }

  protected successWithTransformOne<TDocument extends mongoose.Document, TDto>(
    data: TDocument,
    transformer: DocumentTransformer<TDocument, TDto>,
    message = "Success",
    code = 200
  ) {
    this.setStatus(code);
    const transformedData = transformer.transform(data);
    return { code, message, data: transformedData };
  }

  protected successWithTransformMany<TDocument extends mongoose.Document, TDto>(
    data: TDocument[],
    transformer: DocumentTransformer<TDocument, TDto>,
    message = "Success",
    code = 200
  ) {
    this.setStatus(code);
    const transformedData = transformer.transformArray(data);
    return { code, message, data: transformedData };
  }
}
