import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "./app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 8787);

const app = createApp({ baseDir: __dirname });

app.listen(PORT, () => {
  console.log(`peak-access-linkedin-backend listening on http://localhost:${PORT}`);
});
