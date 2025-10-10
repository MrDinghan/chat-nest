export interface IUserDTO {
  /**
   * User email
   * @example "user@example.com"
   */
  email: string;
  /**
   * User fullname
   * @example "John Doe"
   */
  fullname: string;
  /**
   * User password
   * @example "psw123"
   */
  password: string;
  /**
   * User profile picture
   * @example "https://example.com/profile.jpg"
   */
  profilePic?: string;
}
