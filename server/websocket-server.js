const { WebSocketServer, WebSocket } = require("ws");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
let wssInstance = null;
let serialPort = null;
let parser = null;
function initializeWebSocketServer() {
  if (wssInstance) return wssInstance;
  wssInstance = new WebSocketServer({
    port: 3001,
    clientTracking: true,
    handleProtocols: (protocols) => {
      const protocolArray = Array.from(protocols);
      return protocolArray[0] || false;
    },
  });
  wssInstance.on("connection", (ws) => {
    console.log("Client connected");
    ws.on("error", (error) => {
      console.error("WebSocket client error:", error);
    });
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
function broadcast(message) {
  if (!wssInstance) return;
  const messageString =
    typeof message !== "string" ? JSON.stringify(message) : message;
  wssInstance.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
}
async function findArduinoPort() {
  try {
    const ports = await SerialPort.list();
    const arduinoPort = ports.find(
      (port) =>
        port.vendorId === "2341" ||
        port.vendorId === "1A86" ||
        (port.manufacturer &&
          port.manufacturer.toLowerCase().includes("arduino")) ||
        (port.manufacturer && port.manufacturer.toLowerCase().includes("ch340"))
    );
    if (arduinoPort) {
      console.log(
        `Found Arduino-compatible device on port: ${arduinoPort.path}`
      );
      return arduinoPort.path;
    } else {
      console.log("No Arduino-compatible device found.");
      return null;
    }
  } catch (error) {
    console.error("Error listing serial ports:", error);
    return null;
  }
}
async function connectToArduino() {
  if (serialPort?.isOpen) {
    return true;
  }
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
      autoOpen: false,
    });
    await new Promise((resolve, reject) => {
      if (!serialPort) return reject(new Error("Serial port instance is null"));
      serialPort.open((err) => {
        if (err) {
          console.error(`Failed to open port ${portPath}:`, err.message);
          serialPort = null;
          reject(err);
        } else {
          console.log(`Serial port ${portPath} opened successfully.`);
          resolve(true);
        }
      });
    });
    if (!serialPort) return false;
    parser = serialPort.pipe(new ReadlineParser({ delimiter: "\r\n" }));
    parser.on("data", (rawData) => {
      const cleanedData = rawData.toString().trim();
      if (!cleanedData) {
        return;
      }
      try {
        JSON.parse(cleanedData);
        const message = { type: "data", data: cleanedData };
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
    });
    serialPort.on("close", () => {
      console.log(`Serial port ${portPath} closed.`);
      serialPort = null;
      parser = null;
      broadcast({ type: "status", connected: false });
    });
    broadcast({ type: "status", connected: true });
    return true;
  } catch (error) {
    console.error(`Failed to connect to ${portPath}:`, error);
    if (serialPort && serialPort.isOpen) {
      serialPort.close();
    }
    serialPort = null;
    parser = null;
    broadcast({ type: "status", connected: false });
    return false;
  }
}
initializeWebSocketServer();
let connectInterval;
async function manageConnection() {
  console.log("Checking Arduino connection...");
  if (!serialPort || !serialPort.isOpen) {
    await connectToArduino();
  }
}
manageConnection();
connectInterval = setInterval(manageConnection, 10000);
process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down...");
  clearInterval(connectInterval);
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
