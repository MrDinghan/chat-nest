import mongoose from "mongoose";

import { GroupDto } from "./group.dto";

const groupSchema = new mongoose.Schema<GroupDto>(
  {
    name: { type: String, required: true },
    avatar: { type: String, default: "" },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

const Group = mongoose.model("Group", groupSchema);

export default Group;
