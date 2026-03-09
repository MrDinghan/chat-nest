import mongoose from "mongoose";

import { BaseDocumentDto } from "./base.response.dto";
import { IUserDTO } from "./user.dto";

const userSchema = new mongoose.Schema<IUserDTO & BaseDocumentDto>(
  {
    email: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
