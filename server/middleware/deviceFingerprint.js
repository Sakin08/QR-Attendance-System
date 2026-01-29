const crypto = require("crypto");

const generateDeviceFingerprint = (req, res, next) => {
  try {
    const fingerprint = {
      userAgent: req.headers["user-agent"] || "",
      acceptLanguage: req.headers["accept-language"] || "",
      acceptEncoding: req.headers["accept-encoding"] || "",
      connection: req.headers["connection"] || "",
      // Get real IP address (considering proxies)
      ipAddress:
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null),
      // Additional headers for fingerprinting
      dnt: req.headers["dnt"] || "",
      upgradeInsecureRequests: req.headers["upgrade-insecure-requests"] || "",
    };

    // Create hash of fingerprint data
    const fingerprintString = JSON.stringify(fingerprint);
    const deviceId = crypto
      .createHash("sha256")
      .update(fingerprintString)
      .digest("hex");

    req.deviceFingerprint = deviceId;
    req.clientInfo = fingerprint;

    next();
  } catch (error) {
    console.error("Device fingerprint error:", error);
    // Continue without fingerprint in case of error
    req.deviceFingerprint = "unknown";
    req.clientInfo = {};
    next();
  }
};

const validateDeviceFingerprint = async (req, res, next) => {
  try {
    const { deviceFingerprint } = req;
    const { user } = req;

    if (!user || !deviceFingerprint) {
      return next();
    }

    // Check if this device is registered for the user
    if (!user.deviceFingerprints.includes(deviceFingerprint)) {
      // For new device, add to user's device list (max 5 devices)
      if (user.deviceFingerprints.length >= 5) {
        // Remove oldest device
        user.deviceFingerprints.shift();
      }
      user.deviceFingerprints.push(deviceFingerprint);
      await user.save();
    }

    next();
  } catch (error) {
    console.error("Device validation error:", error);
    next();
  }
};

module.exports = {
  generateDeviceFingerprint,
  validateDeviceFingerprint,
};
