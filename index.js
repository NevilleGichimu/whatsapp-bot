require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { sendText } = require("./utils/send");
const handleSurvey = require("./flows/survey");

const {
  getSession,
  updateSession,
  clearSession,
} = require("./utils/sessionStore");

const app = express();
app.use(bodyParser.json());

// Verify webhook (GET)
app.get("/webhook", (req, res) => {
  const verify_token = process.env.VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token && mode === "subscribe" && token === verify_token) {
    console.log("WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Handle messages (POST)
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const from = message?.from;

    if (!message) {
      const raw = JSON.stringify(body, null, 2);
      if (body.entry?.[0]?.changes?.[0]?.value) {
        console.log("📭 Webhook received but no message payload:");
        console.log(raw);
      }
      return res.sendStatus(200); // not an error, just not a message
    }

    console.log("📨 Incoming WhatsApp message:", message);
    console.log("wahome2", message);
    const msgType = message.type;

    console.log("📥 wahometype:", msgType);

    if (msgType === "text") {
      const text = message.text.body.trim();
      const session = getSession(from);

      console.log("🧠 Session state:", session.state);

      switch (session.state) {
        case "unlock":
          // TODO: validate username
          await sendText(
            from,
            `✅ Account unlock request received for *${text}*`
          );
          clearSession(from); // Optional: reset after done
          break;

        case "status":
          // TODO: lookup password expiry
          await sendText(
            from,
            `🔐 Password status for *${text}* is being checked.`
          );

          await sendText(
            from,
            `Your password is valid and will expire in 3 days.`
          );
          clearSession(from);
          break;

        default:
          // fallback: restart survey
          if (
            text.toLowerCase().includes("survey") ||
            text.toLowerCase().includes("start")
          ) {
            await handleSurvey(from, "start");
          } else {
            await sendText(
              from,
              "👋 Hi! Send 'survey' to begin or choose from the options."
            );
          }
      }
    }

    if (msgType === "interactive") {
      const btnId = message.interactive?.button_reply?.id || "";
      if (!btnId) {
        console.warn("⚠️ Button payload not found in message:", message);
        return res.sendStatus(400);
      }

      const handlers = {
        start_survey: {
          state: "start",
          action: () => handleSurvey(from, "start"),
        },
        survey_unlock: {
          state: "unlock",
          action: () => handleSurvey(from, "unlock"),
        },
        survey_status: {
          state: "status",
          action: () => handleSurvey(from, "status"),
        },
        survey_contact: {
          state: "contact",
          action: () => handleSurvey(from, "contact"),
        },
        help: {
          state: null,
          action: () =>
            sendText(from, "ℹ️ Contact ICT at ict.support@kpc.co.ke"),
        },
        cancel: {
          state: null,
          action: () =>
            sendText(from, "🚫 Survey cancelled. You can start again anytime."),
        },
      };

      const handler = handlers[btnId];

      if (handler) {
        if (handler.state) updateSession(from, { state: handler.state });
        else clearSession(from);

        await handler.action();
      } else if (btnId.startsWith("station_")) {
        const station = btnId.split("_")[1];
        updateSession(from, { state: "station_contact", data: { station } });
        await handleSurvey(from, "station_contact", { station });
      } else {
        await sendText(
          from,
          "❓ I didn't understand that button. Please try again."
        );
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("🔥 Error handling webhook:", error.message);
    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
