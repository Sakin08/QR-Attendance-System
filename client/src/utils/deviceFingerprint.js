// Generate device fingerprint for security
export const generateDeviceFingerprint = () => {
  const fingerprint = {
    userAgent: navigator.userAgent || "",
    language: navigator.language || "",
    languages: navigator.languages ? navigator.languages.join(",") : "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    colorDepth: window.screen.colorDepth || "",
    pixelDepth: window.screen.pixelDepth || "",
    platform: navigator.platform || "",
    cookieEnabled: navigator.cookieEnabled || false,
    doNotTrack: navigator.doNotTrack || "",
    hardwareConcurrency: navigator.hardwareConcurrency || "",
    maxTouchPoints: navigator.maxTouchPoints || 0,
    // Canvas fingerprinting (basic)
    canvas: getCanvasFingerprint(),
    // WebGL fingerprinting (basic)
    webgl: getWebGLFingerprint(),
  };

  // Create a hash of the fingerprint
  return btoa(JSON.stringify(fingerprint))
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 32);
};

// Canvas fingerprinting
const getCanvasFingerprint = () => {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return "no-canvas";

    canvas.width = 200;
    canvas.height = 50;

    // Draw some text and shapes
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Attendance System 🎓", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("Security Check", 4, 35);

    return canvas.toDataURL().substring(0, 50);
  } catch (error) {
    return "canvas-error";
  }
};

// WebGL fingerprinting
const getWebGLFingerprint = () => {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) return "no-webgl";

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return "no-debug-info";

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "";
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";

    return `${vendor}~${renderer}`.substring(0, 50);
  } catch (error) {
    return "webgl-error";
  }
};

// Get geolocation if available
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(error);
      },
      options,
    );
  });
};

// Check if device supports camera
export const checkCameraSupport = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(
      (device) => device.kind === "videoinput",
    );
    return videoDevices.length > 0;
  } catch (error) {
    return false;
  }
};

// Request camera permission
export const requestCameraPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment", // Prefer back camera
      },
    });

    // Stop the stream immediately as we just wanted to check permission
    stream.getTracks().forEach((track) => track.stop());

    return true;
  } catch (error) {
    console.error("Camera permission denied:", error);
    return false;
  }
};

// Detect if user is on mobile device
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

// Detect browser type
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browserName = "Unknown";
  let browserVersion = "Unknown";

  if (userAgent.indexOf("Chrome") > -1) {
    browserName = "Chrome";
    browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || "Unknown";
  } else if (userAgent.indexOf("Firefox") > -1) {
    browserName = "Firefox";
    browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || "Unknown";
  } else if (userAgent.indexOf("Safari") > -1) {
    browserName = "Safari";
    browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || "Unknown";
  } else if (userAgent.indexOf("Edge") > -1) {
    browserName = "Edge";
    browserVersion = userAgent.match(/Edge\/(\d+)/)?.[1] || "Unknown";
  }

  return { browserName, browserVersion };
};

export default {
  generateDeviceFingerprint,
  getCurrentLocation,
  checkCameraSupport,
  requestCameraPermission,
  isMobileDevice,
  getBrowserInfo,
};
