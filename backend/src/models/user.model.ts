import mongoose from "mongoose";

import { IUserDTO } from "./user.dto";

const userSchema = new mongoose.Schema<IUserDTO>(
  {
    email: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUserDTO>("User", userSchema);

export default User;
