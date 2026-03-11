export interface BaseDocumentDto {
  /**
   * MongoDB Object ID
   * @example "507f1f77bcf86cd799439011"
   */
  _id: string;
  /**
   * @example "2023-10-01T00:00:00.000Z"
   */
  createdAt: Date | string;
  /**
   * @example "2023-10-01T00:00:00.000Z"
   */
  updatedAt: Date | string;
}
