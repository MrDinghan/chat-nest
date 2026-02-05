import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";

import { setCloudinary } from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import { RegisterRoutes } from "@/routes/routes";
import { HttpStatus } from "@/types/HttpStatus";

import * as swaggerDocumentRaw from "../dist/swagger.json";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

setCloudinary();

app.use(express.json());
app.use(cookieParser());

const router = express.Router();
RegisterRoutes(router);
app.use("/api", router);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unexpected error:", err);
  return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    code: HttpStatus.INTERNAL_SERVER_ERROR,
    message: err.message ?? "Internal server error",
    data: null,
  });
});

const swaggerDocument = {
  ...swaggerDocumentRaw,
  paths: Object.fromEntries(
    Object.entries(swaggerDocumentRaw.paths).map(([path, value]) => [
      `/api${path}`,
      value,
    ]),
  ),
};
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/swagger.json", (req, res) => {
  res.json(swaggerDocument);
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../", "frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(
      path.resolve(__dirname, "../../", "frontend", "dist", "index.html"),
    );
  });
}

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
