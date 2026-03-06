import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "../app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep baseDir rooted to /backend so data/sequences.json resolves.
const app = createApp({ baseDir: path.resolve(__dirname, "..") });

export default app;
