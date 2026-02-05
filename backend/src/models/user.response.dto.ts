import { IUserDTO } from "./user.dto";

export interface UserResponseDto extends IUserDTO {
  /**
   * MongoDB Object ID
   * @example "507f1f77bcf86cd799439011"
   */
  _id: string;

  /**
   * Created timestamp
   * @example "2023-10-01T00:00:00.000Z"
   */
  createdAt: string;

  /**
   * Updated timestamp
   * @example "2023-10-01T00:00:00.000Z"
   */
  updatedAt: string;
}
