import dotenv from "dotenv";
import express from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";

import { connectDB } from "@/lib/db";
import { RegisterRoutes } from "@/routes/routes";

import * as swaggerDocumentRaw from "../dist/swagger.json";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const router = express.Router();
RegisterRoutes(router);
app.use("/api", router);

const swaggerDocument = {
  ...swaggerDocumentRaw,
  paths: Object.fromEntries(
    Object.entries(swaggerDocumentRaw.paths).map(([path, value]) => [
      `/api${path}`,
      value,
    ])
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
      path.resolve(__dirname, "../../", "frontend", "dist", "index.html")
    );
  });
}

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
