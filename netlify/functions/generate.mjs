import { generateSiteHtml } from "../../shared/generation.js";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  try {
    const { form, style } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    const result = await generateSiteHtml(form, style, apiKey);

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers,
    });
  } catch (err) {
    console.error("[netlify/generate]", err);
    return new Response(
      JSON.stringify({ error: "Erreur serveur lors de la génération." }),
      { status: 500, headers },
    );
  }
};
