// @ts-check
const { WebSocketServer } = require("ws");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

/** @type {SerialPort | null} */
let serialPort = null;
/** @type {ReadlineParser | null} */
let parser = null;

const wss = new WebSocketServer({
  port: 3001,
  clientTracking: true,
  handleProtocols: (protocols) => {
    return protocols?.[0] || false;
  },
});

async function findArduinoPort() {
  try {
    const ports = await SerialPort.list();
    console.log("Available ports:", ports);

    const arduinoPort = ports.find(
      (port) =>
        port.vendorId === "2341" ||
        (port.manufacturer &&
          port.manufacturer.toLowerCase().includes("arduino"))
    );

    if (arduinoPort) {
      console.log("Found Arduino on port:", arduinoPort.path);
    } else {
      console.log(
        "No Arduino found in ports:",
        ports.map((p) => `${p.path} (${p.manufacturer || "unknown"})`)
      );
    }

    return arduinoPort?.path;
  } catch (error) {
    console.error("Error listing ports:", error);
    return null;
  }
}

async function connectToArduino() {
  try {
    const portPath = await findArduinoPort();
    if (!portPath) {
      console.log("No Arduino found, will retry in 5 seconds");
      return false;
    }

    if (serialPort?.isOpen) {
      console.log("Port is already open");
      return true;
    }

    serialPort = new SerialPort({
      path: portPath,
      baudRate: 9600,
      autoOpen: false,
    });

    await new Promise((resolve, reject) => {
      if (!serialPort) return reject(new Error("No serial port"));

      serialPort.open((err) => {
        if (err) {
          console.error("Failed to open port:", err);
          reject(err);
          return;
        }
        console.log("Serial port opened successfully");
        resolve(true);
      });
    });

    parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

    parser.on("data", (data) => {
      const message = JSON.stringify({ type: "data", data });
      console.log("Sending to clients:", message);

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocketServer.OPEN) {
          client.send(message);
        }
      });
    });

    serialPort.on("error", (error) => {
      console.error("Serial port error:", error);
      reconnect();
    });

    serialPort.on("close", () => {
      console.log("Serial port closed");
      reconnect();
    });

    return true;
  } catch (error) {
    console.error("Failed to connect:", error);
    return false;
  }
}

function reconnect() {
  if (serialPort?.isOpen) {
    serialPort.close();
  }
  setTimeout(() => {
    console.log("Attempting to reconnect...");
    connectToArduino().catch(console.error);
  }, 5000);
}

wss.on("connection", (ws) => {
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

wss.on("error", (error) => {
  console.error("WebSocket server error:", error);
});

// Initial connection
console.log("Starting WebSocket server on port 3001...");
connectToArduino().catch(console.error);

// Keep trying to connect if Arduino is not found
setInterval(async () => {
  if (!serialPort?.isOpen) {
    await connectToArduino().catch(console.error);
  }
}, 5000);

process.on("SIGINT", () => {
  console.log("Shutting down...");
  if (serialPort?.isOpen) {
    serialPort.close();
  }
  wss.close();
  process.exit(0);
});
