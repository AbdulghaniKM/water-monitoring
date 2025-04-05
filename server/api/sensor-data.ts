import { ReadlineParser } from "@serialport/parser-readline";
import { defineEventHandler } from "h3";
import { SerialPort } from "serialport";

// Configuration
const SERIAL_PORT_PATH = "COM3"; // Your Arduino's serial port
const BAUD_RATE = 9600; // Match your Arduino's Serial.begin rate

// --- Serial Port Setup ---
// Store the latest data received from the Arduino
let latestSensorData: {
  temperature: number | null;
  waterDetected: boolean;
} | null = null;
let port: SerialPort | null = null;
let parser: ReadlineParser | null = null;
let isPortInitialized = false;

function initializeSerialPort() {
  if (isPortInitialized) {
    console.log("Serial port already initialized.");
    return;
  }

  console.log(`Attempting to open serial port: ${SERIAL_PORT_PATH}`);
  port = new SerialPort(
    { path: SERIAL_PORT_PATH, baudRate: BAUD_RATE },
    (err) => {
      if (err) {
        console.error(`Error opening port ${SERIAL_PORT_PATH}:`, err.message);
        // Reset flag so initialization can be retried if needed (e.g., server restart)
        isPortInitialized = false;
        port = null; // Ensure port is null if opening failed
      }
    }
  );

  if (!port) return; // Exit if port creation failed immediately

  parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" })); // Matches Arduino's Serial.println()

  port.on("open", () => {
    console.log(`Serial port ${SERIAL_PORT_PATH} opened successfully.`);
    isPortInitialized = true;
  });

  parser.on("data", (line) => {
    try {
      // console.log(`Raw data: ${line}`); // Uncomment for debugging
      const data = JSON.parse(line);
      // Basic validation
      if (
        typeof data === "object" &&
        data !== null &&
        ("temperature" in data || "waterDetected" in data)
      ) {
        latestSensorData = {
          temperature:
            data.temperature !== undefined ? Number(data.temperature) : null,
          waterDetected: Boolean(data.waterDetected),
        };
        // console.log('Received sensor data:', latestSensorData); // Uncomment for debugging
      } else {
        console.warn("Received malformed JSON:", line);
      }
    } catch (error) {
      console.error("Error parsing JSON:", error, "Received line:", line);
    }
  });

  port.on("error", (err) => {
    console.error(`Serial port ${SERIAL_PORT_PATH} error:`, err.message);
    // Attempt to close and nullify if an error occurs
    if (port && port.isOpen) {
      port.close();
    }
    port = null;
    parser = null;
    isPortInitialized = false;
    latestSensorData = null; // Reset data on error
  });

  port.on("close", () => {
    console.log(`Serial port ${SERIAL_PORT_PATH} closed.`);
    port = null;
    parser = null;
    isPortInitialized = false;
    latestSensorData = null; // Reset data on close
    // Optional: You might want to add retry logic here to reopen the port
  });
}

// --- Initialize on Server Start ---
// Nitro (Nuxt's server engine) might re-evaluate this file.
// The isPortInitialized flag prevents multiple initializations.
// NOTE: In development with HMR, this might still lead to issues if the
// module is fully reloaded. Proper singleton management might be needed
// in more complex scenarios or if issues arise.
initializeSerialPort();

// --- API Endpoint ---
export default defineEventHandler((event) => {
  // Check if port failed to initialize or is closed
  if (!isPortInitialized || !port || !port.isOpen) {
    // Optionally try to re-initialize here if desired
    // initializeSerialPort(); // Be cautious with re-initialization logic

    // Return an error state or the last known data with a status indicator
    event.node.res.statusCode = 503; // Service Unavailable
    return {
      error: "Serial port not connected or initialized.",
      lastData: latestSensorData,
    };
  }

  // Return the latest data we have
  return latestSensorData;
});

// --- Graceful Shutdown ---
// Handle server shutdown signals to close the port cleanly
// This might require more specific integration depending on your deployment environment
const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGQUIT"];
signals.forEach((signal) => {
  process.on(signal, () => {
    console.log(`Received ${signal}, closing serial port...`);
    if (port && port.isOpen) {
      port.close((err) => {
        if (err) {
          console.error("Error closing port on shutdown:", err.message);
        } else {
          console.log("Serial port closed successfully.");
        }
        process.exit(err ? 1 : 0);
      });
    } else {
      process.exit(0);
    }
  });
});
