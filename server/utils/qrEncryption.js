const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const generateQRToken = (sessionData) => {
  const payload = {
    sessionId: sessionData.sessionId,
    presetId: sessionData.presetId,
    teacherId: sessionData.teacherId,
    timestamp: Date.now(),
    random: crypto.randomBytes(16).toString("hex"),
    uuid: uuidv4(),
  };

  return jwt.sign(payload, process.env.QR_SECRET, {
    expiresIn: "90s",
    issuer: "attendance-system",
    audience: "student-app",
  });
};

const verifyQRToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.QR_SECRET, {
      issuer: "attendance-system",
      audience: "student-app",
    });

    return {
      valid: true,
      data: decoded,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
};

const encryptSensitiveData = (data) => {
  const algorithm = "aes-256-gcm";
  const key = crypto.scryptSync(process.env.QR_SECRET, "salt", 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from("attendance-system", "utf8"));

  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
};

const decryptSensitiveData = (encryptedData) => {
  try {
    const algorithm = "aes-256-gcm";
    const key = crypto.scryptSync(process.env.QR_SECRET, "salt", 32);

    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from("attendance-system", "utf8"));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, "hex"));

    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error("Failed to decrypt data");
  }
};

module.exports = {
  generateQRToken,
  verifyQRToken,
  encryptSensitiveData,
  decryptSensitiveData,
};
