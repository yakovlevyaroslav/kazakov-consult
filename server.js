const express = require("express");
const path = require("path");
const fs = require("fs");

const envPath = path.resolve(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key && !process.env[key]) process.env[key] = value;
  }
}

const app = express();
const port = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === "production";

// Предрелиз: запрет индексации (вместе с meta robots и public/robots.txt). Уберите перед продом.
app.use((_req, res, next) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const verifyCaptcha = async (token, ip) => {
  const secret = process.env.SMARTCAPTCHA_SECRET_KEY;
  if (!secret) {
    throw new Error("Server is not configured: SMARTCAPTCHA_SECRET_KEY is missing.");
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("token", token);
  if (ip) body.set("ip", ip);

  const response = await fetch("https://smartcaptcha.yandexcloud.net/validate", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Captcha validation failed with status ${response.status}`);
  }

  const result = await response.json();
  return Boolean(result?.status === "ok");
};

const sendLeadToEmail = async ({ name, contact, surveyAnswers }) => {
  const recipientEmail = process.env.FORM_RECIPIENT_EMAIL;
  if (!recipientEmail) {
    throw new Error("Server is not configured: FORM_RECIPIENT_EMAIL is missing.");
  }

  const subject = process.env.FORM_SUBJECT || "Новая заявка с лендинга";
  const publicUrl = process.env.FORM_PUBLIC_URL || "http://localhost:8080";
  const endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`;
  const payload = new FormData();
  payload.append("name", name);
  payload.append("contact", contact);
  payload.append("_subject", subject);
  payload.append("_template", "table");
  payload.append("_captcha", "false");

  if (surveyAnswers) {
    payload.append("survey_q1", surveyAnswers.q1 || "");
    payload.append("survey_q2", surveyAnswers.q2 || "");
    payload.append("survey_q3", surveyAnswers.q3 || "");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body: payload,
    headers: {
      Accept: "application/json",
      Origin: publicUrl,
      Referer: `${publicUrl}/`,
    },
  });

  if (!response.ok) {
    throw new Error(`Email delivery failed with status ${response.status}`);
  }

  const result = await response.json().catch(() => null);
  if (result && result.success === "false") {
    throw new Error(result.message || "Email delivery failed.");
  }
};

app.post("/api/lead", async (req, res) => {
  try {
    const { name, contact, surveyAnswers, captchaToken } = req.body || {};
    if (!name || !contact || !captchaToken) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "";
    const captchaPassed = await verifyCaptcha(captchaToken, ip);
    if (!captchaPassed) {
      return res.status(400).json({ success: false, message: "Captcha verification failed." });
    }

    await sendLeadToEmail({ name, contact, surveyAnswers });
    return res.json({ success: true });
  } catch (error) {
    console.error("[api/lead]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process lead.",
      ...(isProd
        ? {}
        : { error: error instanceof Error ? error.message : "Unknown error" }),
    });
  }
});

app.use(express.static(path.resolve(__dirname, "dist")));
app.get("*", (_req, res) => {
  res.sendFile(path.resolve(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`API server started: http://localhost:${port}`);
});
