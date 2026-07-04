"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.health = exports.calendarWebhook = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const generative_ai_1 = require("@google/generative-ai");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
// ─── Resolve Gemini API key ──────────────────────────────────────────────────
// Reads from env var set via: firebase functions:secrets:set GEMINI_API_KEY
function resolveApiKey() {
    return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
}
// ─── Tool: check staff availability ──────────────────────────────────────────
async function checkStaffAvailability(staffId, startTime, endTime) {
    const snaps = await db
        .collection("schedules")
        .where("staffIds", "array-contains", staffId)
        .where("startTime", "<", endTime)
        .where("endTime", ">", startTime)
        .get();
    if (snaps.empty)
        return { status: "clear", conflicts: "0" };
    return {
        status: "conflict",
        conflicts: String(snaps.size),
        message: `Staff ${staffId} has ${snaps.size} overlapping booking(s) between ${startTime} and ${endTime}`,
    };
}
// ─── Tool: upsert schedule ───────────────────────────────────────────────────
async function upsertSchedule(eventId, payload) {
    await db.collection("schedules").doc(eventId).set(payload, { merge: true });
    return `Schedule ${eventId} committed to Firestore.`;
}
// ─── Tool: log system alert ──────────────────────────────────────────────────
async function logSystemAlert(severity, message) {
    await db.collection("system_state").doc("global_dashboard").set({
        activeAlerts: firestore_1.FieldValue.arrayUnion({
            severity,
            message,
            timestamp: firestore_1.FieldValue.serverTimestamp(),
        }),
    }, { merge: true });
    return `Alert logged: [${severity}] ${message}`;
}
// ─── Calendar Webhook ────────────────────────────────────────────────────────
exports.calendarWebhook = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    const payload = req.body;
    if (!payload || Object.keys(payload).length === 0) {
        res.status(200).json({ status: "ignored", reason: "empty body" });
        return;
    }
    const apiKey = resolveApiKey();
    if (!apiKey) {
        // Log to Firestore but don't fail the webhook
        await logSystemAlert("warning", "Calendar webhook received but Gemini API key is not configured");
        res.status(200).json({ status: "logged", warning: "AI key missing — payload stored raw" });
        return;
    }
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: "You are Hermes, the ESCC operations agent for Fresh People (SA events staffing). " +
            "You have three tools: check_staff_availability, upsert_schedule, log_system_alert. " +
            "Process the calendar payload: check for conflicts, upsert valid schedules, log alerts for issues. " +
            "Be concise. Return a JSON summary with actions_taken array.",
    });
    const tools = {
        check_staff_availability: checkStaffAvailability,
        upsert_schedule: upsertSchedule,
        log_system_alert: logSystemAlert,
    };
    try {
        const prompt = `Process this calendar webhook payload and use the available tools to handle it:\n${JSON.stringify(payload, null, 2)}`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        res.status(200).json({
            status: "processed",
            hermes_report: text,
        });
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("[ calendarWebhook ] Gemini error:", errMsg);
        await logSystemAlert("error", `Calendar webhook AI processing failed: ${errMsg}`);
        res.status(500).json({
            status: "error",
            message: errMsg,
        });
    }
});
// ─── Health check endpoint ───────────────────────────────────────────────────
exports.health = (0, https_1.onRequest)({ cors: true }, (_req, res) => {
    res.status(200).json({ status: "ok", service: "escc-functions", timestamp: new Date().toISOString() });
});
