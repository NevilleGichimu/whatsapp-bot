// utils/sessionStore.js

const sessions = {};

function getSession(user) {
  if (!sessions[user]) {
    sessions[user] = { state: "start", data: {} };
  }
  return sessions[user];
}

function updateSession(user, updates) {
  sessions[user] = { ...getSession(user), ...updates };
}

function clearSession(user) {
  delete sessions[user];
}

module.exports = { getSession, updateSession, clearSession };
