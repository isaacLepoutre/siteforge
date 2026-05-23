import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 3001;

function getApiKey() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  return key || null;
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function buildPrompt(form, style) {
  return `Tu es un expert en création de sites web pour commerces locaux. Génère un site HTML complet, moderne et professionnel pour ce commerce.

INFOS DU COMMERCE :
- Nom : ${form.nom}
- Type : ${form.type}
- Description : ${form.description}
- Adresse : ${form.adresse || "Non renseignée"}
- Téléphone : ${form.telephone || "Non renseigné"}
- Email : ${form.email || "Non renseigné"}
- Horaires : ${form.horaires || "Non renseignés"}
- Services/Produits : ${form.services || "Non renseignés"}

STYLE SOUHAITÉ : ${style.label}
Couleur principale : ${style.color}
Couleur d'accent : ${style.accent}

INSTRUCTIONS :
- Crée un fichier HTML complet (avec CSS intégré dans <style> et JS minimal dans <script>)
- Design professionnel, moderne, adapté mobile (responsive)
- Sections : Hero avec le nom et accroche, À propos, Services/Produits, Horaires, Contact avec formulaire
- Utilise Google Fonts pour la typographie
- Animations CSS subtiles au scroll
- Formulaire de contact fonctionnel visuellement
- Couleurs cohérentes avec le style demandé
- NE mets PAS de backticks ou markdown, retourne UNIQUEMENT le code HTML brut commençant par <!DOCTYPE html>`;
}

function extractHtml(text) {
  if (!text) return "";
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const doctypeIndex = trimmed.search(/<!DOCTYPE html>/i);
  if (doctypeIndex >= 0) return trimmed.slice(doctypeIndex);
  return trimmed;
}

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

  if (!form?.nom || !form?.type || !form?.description) {
    return res.status(400).json({
      error: "Champs requis manquants : nom, type et description.",
    });
  }

  if (!style?.label || !style?.color || !style?.accent) {
    return res.status(400).json({ error: "Style visuel invalide." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        messages: [{ role: "user", content: buildPrompt(form, style) }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const message =
        data.error?.message || data.message || "Erreur API Anthropic";
      console.error("[proxy] Erreur Anthropic:", response.status, message);
      return res.status(response.status).json({ error: message });
    }

    console.log("[proxy] Anthropic OK, extraction du HTML…");

    const raw = data.content?.map((block) => block.text || "").join("") || "";
    const html = extractHtml(raw);

    if (!html) {
      return res.status(502).json({
        error: "L'IA n'a pas renvoyé de HTML. Réessaie.",
      });
    }

    res.json({ html });
  } catch (err) {
    console.error("Erreur proxy:", err);
    res.status(500).json({
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
