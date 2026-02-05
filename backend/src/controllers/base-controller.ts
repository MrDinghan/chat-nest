import { Response } from "express";
import { Controller } from "tsoa";

import { HttpStatus } from "@/types/HttpStatus";

export class BaseController extends Controller {
  protected success<T>(data: T, message = "Success", code = HttpStatus.OK) {
    this.setStatus(code);
    return { code, message, data };
  }

  protected fail(
    message: string,
    code = HttpStatus.BAD_REQUEST,
    data: any = null,
  ) {
    this.setStatus(code);
    return { code, message, data };
  }

  protected setTokenCookie(res: Response, token: string, maxAgeDays = 7) {
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
    });
  }
}
