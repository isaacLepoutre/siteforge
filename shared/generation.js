export function buildPrompt(form, style) {
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

export function extractHtml(text) {
  if (!text) return "";
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const doctypeIndex = trimmed.search(/<!DOCTYPE html>/i);
  if (doctypeIndex >= 0) return trimmed.slice(doctypeIndex);
  return trimmed;
}

export async function generateSiteHtml(form, style, apiKey) {
  if (!apiKey) {
    return { status: 500, body: { error: "Clé API manquante (ANTHROPIC_API_KEY)." } };
  }

  if (!form?.nom || !form?.type || !form?.description) {
    return {
      status: 400,
      body: { error: "Champs requis manquants : nom, type et description." },
    };
  }

  if (!style?.label || !style?.color || !style?.accent) {
    return { status: 400, body: { error: "Style visuel invalide." } };
  }

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
    return { status: response.status, body: { error: message } };
  }

  const raw = data.content?.map((block) => block.text || "").join("") || "";
  const html = extractHtml(raw);

  if (!html) {
    return {
      status: 502,
      body: { error: "L'IA n'a pas renvoyé de HTML. Réessaie." },
    };
  }

  return { status: 200, body: { html } };
}
