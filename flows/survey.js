// flows/survey.js
const { sendText, sendQuickReplyButtons } = require("../utils/send");

async function handleSurvey(user, state = "start", data = {}) {
  const handlers = {
    start: sendMainMenu,
    unlock: sendUnlockPrompt,
    status: sendStatusPrompt,
    contact: sendStationMenu,
    station_contact: sendStationContact,
  };

  if (handlers[state]) {
    await handlers[state](user, data);
  } else {
    console.warn(`⚠️ Unknown survey state: ${state}`);
    await sendText(user, "⚠️ Sorry, something went wrong. Please try again.");
  }
}

async function sendMainMenu(user) {
  await sendQuickReplyButtons(
    user,
    "📝 Welcome to KPC ICT Self-Service\nWhat would you like to do?",
    [
      { id: "survey_unlock", title: "🔓 Unlock Account" },
      { id: "survey_status", title: "🔐 Check Password" },
      { id: "survey_contact", title: "📞 ICT Contact" },
    ]
  );
}

async function sendUnlockPrompt(user) {
  await sendText(user, "🔐 Please enter your *username* (e.g. John.Doe)");
  // TODO: handle capture + validate + unlock count
}

async function sendStatusPrompt(user) {
  await sendText(user, "🆔 Please enter your *Staff ID* (e.g. John.Doe)");
  // TODO: handle expiry logic
}

async function sendStationMenu(user) {
  await sendQuickReplyButtons(user, "📍 Select your current station:", [
    { id: "station_Mombasa", title: "Mombasa" },
    { id: "station_Nairobi", title: "Nairobi" },
    // { id: "station_Eldoret", title: "Eldoret" },
    // { id: "station_Kisumu", title: "Kisumu" },
    { id: "station_Other", title: "Other" },
  ]);
}

async function sendStationContact(user, data) {
  const stations = {
    Mombasa: { phone: "1045", email: "ict.mombasa@kpc.co.ke" },
    Nairobi: { phone: "1046", email: "ict.nairobi@kpc.co.ke" },
    // Eldoret: { phone: "1047", email: "ict.eldoret@kpc.co.ke" },
    // Kisumu: { phone: "1048", email: "ict.kisumu@kpc.co.ke" },
    Other: { phone: "1000", email: "ict@kpc.co.ke" },
  };

  const info = stations[data.station] || stations.Other;

  await sendText(
    user,
    `📍 ICT Office – ${data.station}\n📞 Phone: ${info.phone}\n📧 Email: ${info.email}\n🕒 Hours: Mon–Fri, 8am–5pm`
  );
}

module.exports = handleSurvey;
