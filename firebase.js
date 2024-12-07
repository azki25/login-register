var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Inisialisasi Firestore
const db = admin.firestore();

module.exports = { admin, db };
