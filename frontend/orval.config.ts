import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "http://localhost:3000/swagger.json",
    output: {
      mode: "tags",
      target: "./src/api/endpoints",
      client: "react-query",
    },
  },
});
