const axios = require("axios");

const token ='<my-token>';//replace with actual token
const phone_number= '<my-phone-number>';//replace with actual phone number
const url = `https://graph.facebook.com/v17.0/${phone_number}/messages`;
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

async function sendText(to, text) {
  try {
    await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to,
        text: { body: text },
        type: "text"
      },
      { headers }
    );
  } catch (err) {
    console.error("❌ sendText error:", err.response?.data || err.message);
    throw err;
  }
}


async function sendImage(to, imageUrl, caption = "") {
  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "image",
      image: {
        link: imageUrl,
        caption,
      },
    },
    { headers }
  );
}

async function sendButtons(to, bodyText, buttons) {
  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: bodyText,
        },
        action: {
          buttons,
        },
      },
    },
    { headers }
  );
}

async function sendQuickReplyButtons(to, text, buttons) {
  try {
    await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text,
          },
          action: {
            buttons: buttons.map((btn, i) => ({
              type: "reply",
              reply: {
                id: btn.id,
                title: btn.title,
              },
            })),
          },
        },
      },
      { headers }
    );
  } catch (err) {
    console.error("❌ sendQuickReplyButtons error:", err.response?.data || err.message);
    throw err;
  }
}



module.exports = {
  sendText,
  sendImage,
  sendButtons,
  sendQuickReplyButtons
};
