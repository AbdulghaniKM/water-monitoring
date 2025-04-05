<template>
  <div class="container">
    <h1>Water Monitoring Dashboard</h1>
    <div v-if="error" class="error-message">
      <p>Error connecting to WebSocket server: {{ error }}</p>
      <p>Please ensure the backend server is running.</p>
    </div>
    <div v-else-if="!isConnected" class="status-message">
      <p>Connecting to WebSocket server...</p>
    </div>
    <div v-else class="data-display">
      <h2>Live Sensor Readings</h2>
      <div v-if="sensorData" class="sensor-values">
        <p>Temperature: {{ formatTemperature(sensorData.temperature) }}</p>
        <p>
          Water Status:
          {{
            sensorData.waterDetected ? "Water Detected!" : "No Water Detected"
          }}
        </p>
      </div>
      <div v-else class="status-message">
        <p>Waiting for data from Arduino...</p>
      </div>
      <p class="arduino-status">
        Arduino Connection Status:
        {{ isArduinoConnected ? "Connected" : "Disconnected" }}
      </p>
    </div>

    <!-- Optional: Display raw messages for debugging -->
    <!-- <pre>Raw Message: {{ rawMessage }}</pre> -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

// --- Configuration ---
const WEBSOCKET_URL = "ws://localhost:3001"; // Matches your websocket-server.js port

// --- Reactive State ---
const isConnected = ref(false); // WebSocket server connection status
const isArduinoConnected = ref(false); // Arduino connection status reported by server
const sensorData = ref<{
  temperature: number | null;
  waterDetected: boolean;
} | null>(null);
const error = ref<string | null>(null);
const rawMessage = ref<string | null>(null); // For debugging

let socket: WebSocket | null = null;

// --- WebSocket Logic ---
function connectWebSocket() {
  console.log(`Attempting to connect to WebSocket: ${WEBSOCKET_URL}`);
  error.value = null; // Clear previous errors
  isConnected.value = false;
  isArduinoConnected.value = false;
  sensorData.value = null;

  try {
    socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => {
      console.log("WebSocket connection established.");
      isConnected.value = true;
      error.value = null;
      // The server should send status immediately after connection
    };

    socket.onmessage = (event) => {
      rawMessage.value = event.data; // Store raw message for debugging
      // console.log('Raw WS message:', event.data);
      try {
        const message = JSON.parse(event.data);

        if (message.type === "status") {
          console.log("Received status:", message);
          isArduinoConnected.value = !!message.connected;
          // Reset sensor data if Arduino disconnected
          if (!isArduinoConnected.value) {
            sensorData.value = null;
          }
        } else if (message.type === "data") {
          // The actual sensor data is nested inside a stringified JSON
          if (typeof message.data === "string") {
            try {
              const parsedSensorData = JSON.parse(message.data);
              // console.log('Parsed sensor data:', parsedSensorData);

              // Add basic validation
              if (
                typeof parsedSensorData === "object" &&
                parsedSensorData !== null
              ) {
                sensorData.value = {
                  temperature:
                    parsedSensorData.temperature !== undefined &&
                    parsedSensorData.temperature !== null
                      ? Number(parsedSensorData.temperature)
                      : null,
                  waterDetected: Boolean(parsedSensorData.waterDetected),
                };
              } else {
                console.warn(
                  "Received inner data payload is not an object:",
                  message.data
                );
              }
            } catch (innerError) {
              console.error(
                "Error parsing inner sensor data JSON string:",
                innerError,
                "String was:",
                message.data
              );
            }
          } else {
            console.warn(
              "Received data message, but data field is not a string:",
              message
            );
          }
          // Always update Arduino connection status when data arrives
          isArduinoConnected.value = true;
        } else {
          console.warn("Received unknown message type:", message);
        }
      } catch (parseError) {
        console.error(
          "Error parsing WebSocket message JSON:",
          parseError,
          "Raw data:",
          event.data
        );
      }
    };

    socket.onerror = (event) => {
      console.error("WebSocket error:", event);
      error.value = "WebSocket connection failed. Check console for details.";
      isConnected.value = false;
      isArduinoConnected.value = false;
      sensorData.value = null;
    };

    socket.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      isConnected.value = false;
      isArduinoConnected.value = false;
      sensorData.value = null;
      error.value = "WebSocket connection closed.";
      // Optional: Implement reconnection logic here if desired
      // setTimeout(connectWebSocket, 5000); // Example: Try to reconnect after 5 seconds
    };
  } catch (e) {
    console.error("Failed to create WebSocket:", e);
    error.value = "Failed to initialize WebSocket connection.";
  }
}

// --- Lifecycle Hooks ---
onMounted(() => {
  connectWebSocket();
});

onUnmounted(() => {
  if (socket) {
    console.log("Closing WebSocket connection.");
    socket.close();
  }
});

// --- Formatting ---
function formatTemperature(temp: number | null): string {
  if (temp === null || temp === undefined) {
    return "N/A";
  }
  // Format to one decimal place
  return `${temp.toFixed(1)} °C`;
}
</script>

<style scoped>
.container {
  font-family: sans-serif;
  padding: 20px;
  max-width: 600px;
  margin: 40px auto;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
}

h1 {
  text-align: center;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

h2 {
  color: #444;
  margin-bottom: 15px;
}

.data-display,
.status-message,
.error-message {
  margin-top: 20px;
  padding: 15px;
  border-radius: 5px;
}

.error-message {
  background-color: #ffebee;
  border: 1px solid #ef9a9a;
  color: #c62828;
}

.status-message {
  background-color: #e3f2fd;
  border: 1px solid #90caf9;
  color: #1565c0;
  text-align: center;
}

.data-display {
  background-color: #fff;
  border: 1px solid #e0e0e0;
}

.sensor-values p {
  margin: 8px 0;
  font-size: 1.1em;
  color: #555;
}

.sensor-values p:first-child {
  margin-top: 0;
}

.arduino-status {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px dashed #ddd;
  font-size: 0.9em;
  color: #777;
}

pre {
  background-color: #eee;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap; /* Allow wrapping */
  word-wrap: break-word; /* Break long words */
}
</style>
