import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Only load local .env files in development. Vercel injects variables directly in production.
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
}

async function createApp() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Increase payload limit for base64 image transfers
  app.use(express.json({ limit: "12mb" }));
  app.use(express.urlencoded({ limit: "12mb", extended: true }));

  function isValidGeminiApiKey(key: string | undefined): boolean {
    return !!key && key !== "MY_GEMINI_API_KEY" && key !== "";
  }

  // API Check Health — read env at request time (Vercel serverless cold starts)
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      hasApiKey: isValidGeminiApiKey(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  const DEFAULT_SETTINGS = {
    rimLight: 75,
    shadowTint: 20,
    facialClarity: 70,
    colorVibrancy: 65,
    filmicGlow: 50,
    brightness: 48,
    contrast: 58,
    denoise: 80,
  };

  async function parseImagePayload(
    image: string
  ): Promise<{ mimeType: string; base64: string }> {
    if (image.startsWith("http://") || image.startsWith("https://")) {
      const response = await fetch(image);
      if (!response.ok) {
        throw new Error("Failed to fetch remote image URL.");
      }
      const mimeType = response.headers.get("content-type") || "image/jpeg";
      const buffer = Buffer.from(await response.arrayBuffer());
      return { mimeType, base64: buffer.toString("base64") };
    }

    if (image.includes(";base64,")) {
      const [header, data] = image.split(";base64,");
      const mimeType = header.replace("data:", "") || "image/png";
      return { mimeType, base64: data };
    }

    return { mimeType: "image/png", base64: image };
  }

  function buildEnhancementPrompt(settings: typeof DEFAULT_SETTINGS): string {
    return [
      "Enhance this photograph with professional studio lighting and clarity.",
      "Dramatically improve exposure, lift shadows, and add natural volumetric light on faces.",
      "Increase sharpness and micro-detail while preserving exact likeness and composition.",
      "Reduce noise and compression artifacts from low-light capture.",
      `Rim light intensity: ${settings.rimLight}%.`,
      `Shadow warmth (0=cool blue, 100=warm bronze): ${settings.shadowTint}%.`,
      `Facial clarity: ${settings.facialClarity}%. Color vibrancy: ${settings.colorVibrancy}%.`,
      `Filmic glow: ${settings.filmicGlow}%. Brightness: ${settings.brightness}%. Contrast: ${settings.contrast}%.`,
      `Denoise: ${settings.denoise}%.`,
      "Return ONLY the enhanced image. No text, borders, watermarks, or frames.",
    ].join(" ");
  }

  // Secure POST endpoint — API key never leaves the server
  app.post("/api/enhance", async (req, res) => {
    const { image, settings } = req.body;

    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "No image payload supplied." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!isValidGeminiApiKey(apiKey)) {
      return res.status(503).json({
        success: false,
        error: "Gemini API is not configured. Check Vercel Environment Variables.",
      });
    }

    let ai: GoogleGenAI;
    try {
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.error("Failed to initialize Gemini Client:", err);
      return res.status(503).json({
        success: false,
        error: "Failed to initialize Gemini client.",
      });
    }

    try {
      const { mimeType, base64 } = await parseImagePayload(image);
      const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
      const prompt = buildEnhancementPrompt(mergedSettings);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType } },
            { text: prompt },
          ],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const returnMime = part.inlineData.mimeType || mimeType;
          return res.json({
            success: true,
            imageUrl: `data:${returnMime};base64,${part.inlineData.data}`,
            isAiRender: true,
          });
        }
      }

      return res.status(502).json({
        success: false,
        error: "Gemini did not return an enhanced image.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Enhancement failed.";
      console.error("Gemini API error:", message);
      return res.status(500).json({ success: false, error: message });
    }
  });

  // Mount Vite dev middleware locally, or static assets for local production (`npm start`)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware mounted on Express.");
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static server configured.");
  }

  return { app, PORT };
}

const { app, PORT } = await createApp();

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
