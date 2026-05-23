import { useState } from "react";
import { API_BASE } from "./config.js";

const STEPS = ["infos", "style", "generation", "resultat"];

const styleOptions = [
  { id: "moderne", label: "Moderne & Épuré", color: "#0f172a", accent: "#6366f1" },
  { id: "chaleureux", label: "Chaleureux & Local", color: "#78350f", accent: "#f59e0b" },
  { id: "elegant", label: "Élégant & Premium", color: "#1e1b4b", accent: "#c084fc" },
  { id: "frais", label: "Frais & Dynamique", color: "#064e3b", accent: "#34d399" },
];

export default function App() {
  const [step, setStep] = useState("infos");
  const [form, setForm] = useState({
    nom: "",
    type: "",
    description: "",
    adresse: "",
    telephone: "",
    email: "",
    horaires: "",
    services: "",
  });
  const [styleChoisi, setStyleChoisi] = useState("moderne");
  const [loading, setLoading] = useState(false);
  const [siteHTML, setSiteHTML] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const genererSite = async () => {
    setLoading(true);
    setError("");
    const style = styleOptions.find((s) => s.id === styleChoisi);

    if (!style) {
      const msg = "Style visuel introuvable.";
      console.error("[SiteForge]", msg, { styleChoisi });
      setError(msg);
      setLoading(false);
      return;
    }

    const url = `${API_BASE}/api/generate`;
    const payload = {
      form,
      style: {
        label: style.label,
        color: style.color,
        accent: style.accent,
      },
    };

    console.log("[SiteForge] Appel proxy:", url, payload);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        console.error("[SiteForge] Réponse non-JSON:", response.status, rawText.slice(0, 200));
        throw new Error("Réponse invalide du serveur proxy.");
      }

      console.log("[SiteForge] Réponse proxy:", response.status, data);

      if (!response.ok) {
        const msg = data.error || `Erreur serveur (${response.status})`;
        console.error("[SiteForge] Échec génération:", msg);
        setError(msg);
        return;
      }

      if (!data.html) {
        const msg = "Le serveur n'a pas renvoyé de HTML.";
        console.error("[SiteForge]", msg, data);
        setError(msg);
        return;
      }

      console.log("[SiteForge] HTML reçu,", data.html.length, "caractères");
      setSiteHTML(data.html);
      setStep("resultat");
    } catch (err) {
      const msg =
        err.message?.includes("Failed to fetch") || err.name === "TypeError"
          ? `Impossible de joindre le proxy (${API_BASE}). Lance « npm run dev ».`
          : err.message || "Erreur réseau.";
      console.error("[SiteForge] Erreur:", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const lancerGeneration = () => {
    setError("");
    setStep("generation");
    genererSite();
  };

  const telecharger = () => {
    const blob = new Blob([siteHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `site-${form.nom.toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 50%, #0a0a0f 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#e2e8f0",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{
        padding: "24px 32px",
        borderBottom: "1px solid rgba(139,92,246,0.2)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{
          width: 36, height: 36,
          background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
          borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>⚡</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.5px" }}>SiteForge AI</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>Générateur de sites pour commerces</div>
        </div>
        {/* Steps */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {["Infos", "Style", "Génération"].map((s, i) => (
            <div key={i} style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
              background: STEPS[i] === step ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)",
              color: STEPS[i] === step ? "#c4b5fd" : "#64748b",
              border: `1px solid ${STEPS[i] === step ? "rgba(139,92,246,0.5)" : "transparent"}`,
            }}>{i + 1}. {s}</div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px" }}>

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 24,
              padding: "12px 16px",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: 10,
              color: "#fca5a5",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* ÉTAPE 1 : INFOS */}
        {step === "infos" && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: "-1px" }}>
              Infos du commerce 🏪
            </h1>
            <p style={{ color: "#94a3b8", marginBottom: 32, fontSize: 14 }}>
              Remplis les infos de ton client — l'IA s'occupe du reste.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { name: "nom", label: "Nom du commerce *", placeholder: "Ex: Boulangerie Dupont" },
                { name: "type", label: "Type d'activité *", placeholder: "Ex: Boulangerie, Restaurant, Coiffeur..." },
                { name: "adresse", label: "Adresse", placeholder: "Ex: 12 rue de la Paix, 75001 Paris" },
                { name: "telephone", label: "Téléphone", placeholder: "Ex: 01 23 45 67 89" },
                { name: "email", label: "Email", placeholder: "Ex: contact@boulangerie.fr" },
                { name: "horaires", label: "Horaires", placeholder: "Ex: Lun-Sam 7h-19h, Dim 7h-13h" },
              ].map((field) => (
                <div key={field.name}>
                  <label style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "block" }}>
                    {field.label}
                  </label>
                  <input
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    style={{
                      width: "100%", padding: "12px 16px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10, color: "#e2e8f0",
                      fontSize: 14, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}

              {[
                { name: "description", label: "Description du commerce *", placeholder: "Décris le commerce en quelques phrases..." },
                { name: "services", label: "Services / Produits phares", placeholder: "Ex: Pains artisanaux, Viennoiseries, Gâteaux sur commande..." },
              ].map((field) => (
                <div key={field.name}>
                  <label style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "block" }}>
                    {field.label}
                  </label>
                  <textarea
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    rows={3}
                    style={{
                      width: "100%", padding: "12px 16px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10, color: "#e2e8f0",
                      fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => form.nom && form.type && form.description ? setStep("style") : null}
              style={{
                marginTop: 28,
                width: "100%", padding: "14px",
                background: form.nom && form.type && form.description
                  ? "linear-gradient(135deg, #8b5cf6, #06b6d4)"
                  : "rgba(255,255,255,0.05)",
                border: "none", borderRadius: 12,
                color: form.nom && form.type && form.description ? "white" : "#64748b",
                fontSize: 15, fontWeight: 700, cursor: form.nom && form.type && form.description ? "pointer" : "not-allowed",
                letterSpacing: "0.5px",
              }}
            >
              Choisir le style →
            </button>
          </div>
        )}

        {/* ÉTAPE 2 : STYLE */}
        {step === "style" && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: "-1px" }}>
              Choisis le style 🎨
            </h1>
            <p style={{ color: "#94a3b8", marginBottom: 32, fontSize: 14 }}>
              Quel univers visuel pour le site de <strong style={{ color: "#e2e8f0" }}>{form.nom}</strong> ?
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
              {styleOptions.map((style) => (
                <div
                  key={style.id}
                  onClick={() => setStyleChoisi(style.id)}
                  style={{
                    padding: "20px",
                    borderRadius: 14,
                    border: `2px solid ${styleChoisi === style.id ? style.accent : "rgba(255,255,255,0.08)"}`,
                    background: styleChoisi === style.id ? `${style.accent}15` : "rgba(255,255,255,0.03)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{
                    width: "100%", height: 60, borderRadius: 8, marginBottom: 12,
                    background: `linear-gradient(135deg, ${style.color}, ${style.accent})`,
                  }} />
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{style.label}</div>
                  <div style={{
                    marginTop: 6, display: "flex", gap: 6,
                  }}>
                    {[style.color, style.accent].map((c, i) => (
                      <div key={i} style={{ width: 16, height: 16, borderRadius: 4, background: c }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setStep("infos")}
                style={{
                  flex: 1, padding: "14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12, color: "#94a3b8",
                  fontSize: 15, cursor: "pointer",
                }}
              >
                ← Retour
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={lancerGeneration}
                style={{
                  flex: 2, padding: "14px",
                  background: loading
                    ? "rgba(255,255,255,0.1)"
                    : "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                  border: "none", borderRadius: 12,
                  color: "white", fontSize: 15, fontWeight: 700,
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Génération…" : "⚡ Générer le site"}
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : LOADING */}
        {step === "generation" && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{
              width: 80, height: 80, margin: "0 auto 24px",
              background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36,
              animation: "pulse 1.5s ease-in-out infinite",
            }}>⚡</div>
            <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.1);opacity:0.8} }`}</style>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              Génération en cours...
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>
              L'IA crée le site de <strong style={{ color: "#c4b5fd" }}>{form.nom}</strong>.<br />
              Ça prend 15-30 secondes.
            </p>
          </div>
        )}

        {/* ÉTAPE 4 : RÉSULTAT */}
        {step === "resultat" && (
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              marginBottom: 24,
            }}>
              <div style={{
                width: 44, height: 44,
                background: "rgba(52,211,153,0.15)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
              }}>✅</div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Site généré !</h2>
                <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                  Le site de {form.nom} est prêt
                </p>
              </div>
            </div>

            {/* Prévisualisation */}
            <div style={{
              borderRadius: 14, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              marginBottom: 20, height: 400,
            }}>
              <iframe
                srcDoc={siteHTML}
                style={{ width: "100%", height: "100%", border: "none" }}
                title="Prévisualisation"
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => { setStep("style"); setSiteHTML(""); }}
                style={{
                  flex: 1, padding: "13px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12, color: "#94a3b8",
                  fontSize: 14, cursor: "pointer",
                }}
              >
                🔄 Regénérer
              </button>
              <button
                onClick={telecharger}
                style={{
                  flex: 2, padding: "13px",
                  background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                  border: "none", borderRadius: 12,
                  color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                ⬇️ Télécharger le site (.html)
              </button>
            </div>

            <button
              onClick={() => {
                setStep("infos");
                setForm({ nom:"",type:"",description:"",adresse:"",telephone:"",email:"",horaires:"",services:"" });
                setSiteHTML("");
              }}
              style={{
                marginTop: 12, width: "100%", padding: "12px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, color: "#64748b",
                fontSize: 13, cursor: "pointer",
              }}
            >
              + Nouveau commerce
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
