// Hermes Calendar Webhook — Vercel Serverless Function
// Processes calendar events with Gemini AI + Firestore
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Initialize Firebase Admin (once per cold start) ─────────────────────────
function initAdmin() {
  if (getApps().length > 0) return;
  const projectId = process.env.FIREBASE_PROJECT_ID || "freshchat-3545e";

  // Prefer explicit service account JSON (set via Vercel env FIREBASE_SERVICE_ACCOUNT)
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (saJson) {
    try {
      const creds = JSON.parse(saJson);
      initializeApp({ credential: cert(creds), projectId });
      return;
    } catch (e) {
      console.error("[Hermes] Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
    }
  }

  // Fallback: Application Default Credentials (works on GCP, not Vercel)
  initializeApp({ projectId });
}

// ─── Resolve Gemini API key ──────────────────────────────────────────────────
function resolveApiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
}

// ─── Main handler ────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = req.body;
  if (!payload || Object.keys(payload).length === 0) {
    return res.status(200).json({ status: "ignored", reason: "empty body" });
  }

  const apiKey = resolveApiKey();
  if (!apiKey) {
    return res.status(500).json({
      error: "Gemini API key not configured. Set GEMINI_API_KEY in Vercel env vars.",
    });
  }

  try {
    initAdmin();
    const db = getFirestore();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction:
        "You are Hermes, the FPCC operations agent for Fresh People (SA events staffing). " +
        "Process calendar webhook payloads. For each event: " +
        "1. Check staff availability (query Firestore schedules collection for conflicts) " +
        "2. Upsert valid schedules to Firestore " +
        "3. Log alerts for conflicts or issues " +
        "Return a JSON summary: { actions_taken: [...], conflicts: [...], schedules_created: [...] }",
    });

    const prompt = `Process this calendar webhook payload. Use the tools available to check staff availability, upsert schedules, and log alerts:\n${JSON.stringify(payload, null, 2)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Also log the raw webhook to Firestore for audit trail
    await db.collection("webhook_logs").add({
      source: "calendar",
      payload,
      hermes_response: text,
      processed_at: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      status: "processed",
      hermes_report: text,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Hermes Webhook] Error:", errMsg);
    return res.status(500).json({ error: errMsg });
  }
}
