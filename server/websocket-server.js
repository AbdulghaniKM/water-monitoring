// @ts-check
const { WebSocketServer, WebSocket } = require("ws");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

/** @type {import('ws').WebSocketServer | null} */
let wssInstance = null;
/** @type {SerialPort | null} */
let serialPort = null;
/** @type {ReadlineParser | null} */
let parser = null;

// Function to initialize WebSocket Server to avoid potential top-level execution issues
function initializeWebSocketServer() {
  if (wssInstance) return wssInstance;

  wssInstance = new WebSocketServer({
    port: 3001,
    clientTracking: true,
    handleProtocols: (protocols /* Set<string> */) => {
      // Convert Set to Array to safely access first element
      const protocolArray = Array.from(protocols);
      return protocolArray[0] || false; // Return first protocol or false
    },
  });

  wssInstance.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("error", (error) => {
      console.error("WebSocket client error:", error);
    });

    // Send initial status
    ws.send(
      JSON.stringify({
        type: "status",
        connected: serialPort?.isOpen || false,
      })
    );
  });

  wssInstance.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });

  console.log("WebSocket server initialized on port 3001...");
  return wssInstance;
}

// Function to broadcast messages to all connected clients
/**
 * @param {string | object} message - The message to broadcast.
 */
function broadcast(message) {
  if (!wssInstance) return;

  // Ensure message is a string
  const messageString =
    typeof message !== "string" ? JSON.stringify(message) : message;

  wssInstance.clients.forEach((client) => {
    // Check readyState against WebSocket.OPEN (imported constant)
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
}

async function findArduinoPort() {
  try {
    const ports = await SerialPort.list();
    // console.log("Available ports:", ports); // Less verbose logging

    const arduinoPort = ports.find(
      (port) =>
        port.vendorId === "2341" || // Standard Arduino VID
        port.vendorId === "1A86" || // Common CH340 VID used by clones
        (port.manufacturer &&
          port.manufacturer.toLowerCase().includes("arduino")) ||
        (port.manufacturer && port.manufacturer.toLowerCase().includes("ch340")) // Include CH340 manufacturer
    );

    if (arduinoPort) {
      console.log(
        `Found Arduino-compatible device on port: ${arduinoPort.path}`
      );
      return arduinoPort.path;
    } else {
      console.log("No Arduino-compatible device found.");
      // console.log("Available ports:", ports.map((p) => `${p.path} (${p.manufacturer || 'unknown'})`));
      return null;
    }
  } catch (error) {
    console.error("Error listing serial ports:", error);
    return null;
  }
}

async function connectToArduino() {
  if (serialPort?.isOpen) {
    // console.log("Serial port already open.");
    return true; // Already connected
  }

  // Close existing port if attempting reconnection
  if (serialPort) {
    console.log("Closing existing serial port before reconnecting...");
    await new Promise((resolve) => serialPort?.close(resolve));
    serialPort = null;
    parser = null;
  }

  const portPath = await findArduinoPort();
  if (!portPath) {
    console.log("No Arduino found. Will retry connection attempt later.");
    return false;
  }

  console.log(`Attempting to connect to serial port: ${portPath}`);
  try {
    serialPort = new SerialPort({
      path: portPath,
      baudRate: 9600,
      autoOpen: false, // We manually open
    });

    // Manually open the port
    await new Promise((resolve, reject) => {
      if (!serialPort) return reject(new Error("Serial port instance is null"));
      serialPort.open((err) => {
        if (err) {
          console.error(`Failed to open port ${portPath}:`, err.message);
          serialPort = null; // Ensure it's null if open failed
          reject(err);
        } else {
          console.log(`Serial port ${portPath} opened successfully.`);
          resolve(true);
        }
      });
    });

    // If port opening failed, serialPort will be null
    if (!serialPort) return false;

    parser = serialPort.pipe(new ReadlineParser({ delimiter: "\r\n" })); // Match Arduino println

    parser.on("data", (rawData) => {
      const cleanedData = rawData.toString().trim(); // Trim whitespace (like \r)
      if (!cleanedData) {
        // console.log("Received empty line, ignoring."); // Optional debug log
        return; // Ignore empty lines
      }
      try {
        // Validate if it's actually JSON before creating the message
        JSON.parse(cleanedData);
        const message = { type: "data", data: cleanedData };
        // console.log("Sending data to clients:", message); // Less verbose
        broadcast(message);
      } catch (e) {
        console.warn(
          "Received non-JSON data from serial port, ignoring:",
          cleanedData
        );
      }
    });

    serialPort.on("error", (error) => {
      console.error(`Serial port ${portPath} error:`, error.message);
      // No automatic reconnect here, let the interval handle it
    });

    serialPort.on("close", () => {
      console.log(`Serial port ${portPath} closed.`);
      // Clear references when closed
      serialPort = null;
      parser = null;
      // Broadcast disconnect status
      broadcast({ type: "status", connected: false });
      // No automatic reconnect here, let the interval handle it
    });

    // Broadcast connection status
    broadcast({ type: "status", connected: true });
    return true;
  } catch (error) {
    console.error(`Failed to connect to ${portPath}:`, error);
    // Ensure port is considered closed if connection fails
    if (serialPort && serialPort.isOpen) {
      serialPort.close();
    }
    serialPort = null;
    parser = null;
    broadcast({ type: "status", connected: false });
    return false;
  }
}

// --- Main Execution ---

// Initialize WebSocket Server first
initializeWebSocketServer();

// Attempt initial connection, then retry periodically
let connectInterval;
async function manageConnection() {
  console.log("Checking Arduino connection...");
  if (!serialPort || !serialPort.isOpen) {
    await connectToArduino();
  }
}

// Initial attempt
manageConnection();

// Set up interval to check connection status and reconnect if necessary
connectInterval = setInterval(manageConnection, 10000); // Check every 10 seconds

// --- Graceful Shutdown ---
process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down...");
  clearInterval(connectInterval); // Stop reconnection attempts
  if (serialPort?.isOpen) {
    console.log("Closing serial port...");
    serialPort.close(() => {
      console.log("Serial port closed.");
      closeWebSocketServer();
    });
  } else {
    closeWebSocketServer();
  }
});

function closeWebSocketServer() {
  if (wssInstance) {
    console.log("Closing WebSocket server...");
    wssInstance.close(() => {
      console.log("WebSocket server closed.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}
