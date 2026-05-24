import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { generateSiteHtml } from "../shared/generation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 3001;

function getApiKey() {
  return process.env.ANTHROPIC_API_KEY?.trim() || null;
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.post("/api/generate", async (req, res) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("[proxy] ANTHROPIC_API_KEY absente ou vide dans .env");
    return res.status(500).json({
      error: "Clé API manquante. Ajoute ANTHROPIC_API_KEY dans le fichier .env",
    });
  }

  const { form, style } = req.body;
  console.log("[proxy] POST /api/generate →", {
    commerce: form?.nom,
    style: style?.label,
  });

  try {
    const result = await generateSiteHtml(form, style, apiKey);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error("Erreur proxy:", err);
    return res.status(500).json({
      error: "Erreur serveur lors de la génération.",
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    apiKeyConfigured: Boolean(getApiKey()),
  });
});

app.listen(PORT, () => {
  console.log(`Proxy SiteForge → http://localhost:${PORT}`);
  if (!getApiKey()) {
    console.warn("⚠️  ANTHROPIC_API_KEY non définie dans .env");
  } else {
    console.log("✓ Clé API Anthropic chargée");
  }
});
