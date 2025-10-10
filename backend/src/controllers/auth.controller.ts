import { Get, Route, Tags } from "tsoa";

import { ApiResponse } from "@/types/ApiResponse";

import { BaseController } from "./base-controller";

@Route("auth")
@Tags("Auth")
export class AuthController extends BaseController {
  @Get("signup")
  public async signup(): Promise<ApiResponse<any>> {
    return this.success("Signup successful");
  }

  @Get("login")
  public async login(): Promise<ApiResponse<any>> {
    return this.success("Login successful");
  }

  @Get("logout")
  public async logout(): Promise<ApiResponse<any>> {
    return this.success("Logout successful");
  }
}
