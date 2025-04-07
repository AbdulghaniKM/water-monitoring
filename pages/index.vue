<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-6 relative overflow-hidden"
  >
    <!-- Move bubbles container before rain container -->
    <div class="bubbles-container absolute inset-0 pointer-events-none">
      <motion.div
        :animate="{ y: [-10, 10, -10] }"
        :transition="{ duration: 4, repeat: Infinity, ease: 'easeInOut' }"
        class="bubble right-[10%] top-[15%]"
      ></motion.div>
      <motion.div
        :animate="{ y: [-15, 15, -15] }"
        :transition="{ duration: 5, repeat: Infinity, ease: 'easeInOut' }"
        class="bubble left-[15%] top-[35%]"
      ></motion.div>
      <motion.div
        :animate="{ y: [-20, 20, -20] }"
        :transition="{ duration: 6, repeat: Infinity, ease: 'easeInOut' }"
        class="bubble right-[25%] top-[60%]"
      ></motion.div>
    </div>

    <div class="rain-container absolute inset-0 pointer-events-none">
      <div
        v-for="n in 20"
        :key="n"
        class="rain-drop"
        :style="{
          '--delay': `${n * 0.1}s`,
          '--duration': `${0.5 + Math.random()}s`,
          '--position': `${Math.random() * 100}%`,
        }"
      ></div>
    </div>
    <div class="max-w-4xl mx-auto relative z-10">
      <motion.div
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.8 }"
        class="text-center mb-12"
      >
        <div class="relative">
          <motion.div
            :animate="{ y: [-6, 0, -6] }"
            :transition="{ duration: 2, repeat: Infinity, ease: 'easeInOut' }"
            class="absolute -top-6 -left-6 w-12 h-12 text-blue-400"
          >
            <Icon name="mdi:water-drop" class="w-full h-full" />
          </motion.div>
          <motion.div
            :animate="{ y: [-3, 3, -3] }"
            :transition="{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }"
            class="absolute -top-3 -right-3 w-8 h-8 text-cyan-400"
          >
            <Icon name="mdi:water-drop" class="w-full h-full" />
          </motion.div>
          <h1
            class="text-6xl py-10 font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 bg-clip-text text-transparent [text-shadow:_0_1px_3px_rgb(0_0_0_/_10%)] mb-4"
          >
            Water Monitoring System
          </h1>
          <motion.div
            :whileHover="{ scale: 1.05 }"
            :whileTap="{ scale: 0.95 }"
            class="inline-block backdrop-blur-sm bg-white/30 rounded-full px-6 py-2 shadow-lg"
          >
            <p class="text-xl text-blue-800/70 font-medium">IoT Project</p>
          </motion.div>
          <div class="mt-8 space-y-3">
            <div class="relative">
              <p class="text-xl font-semibold text-blue-600 mb-3">
                Developed and Designed By
              </p>
              <div
                class="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50 to-transparent animate-wave opacity-50"
              ></div>
            </div>
            <div class="space-y-2">
              <motion.div
                :initial="{ opacity: 0, x: -20 }"
                :animate="{ opacity: 1, x: 0 }"
                :whileHover="{ scale: 1.02, x: 5 }"
                :whileTap="{ scale: 0.98 }"
                :transition="{ duration: 0.3 }"
                class="developer-card backdrop-blur-md bg-white/40 rounded-lg px-6 py-3 shadow-md"
              >
                <p class="text-xl font-medium text-gray-700" dir="rtl">
                  عبد الغني خالد
                </p>
              </motion.div>
              <motion.div
                :initial="{ opacity: 0, x: -20 }"
                :animate="{ opacity: 1, x: 0 }"
                :whileHover="{ scale: 1.02, x: 5 }"
                :whileTap="{ scale: 0.98 }"
                :transition="{ duration: 0.3, delay: 0.1 }"
                class="developer-card backdrop-blur-md bg-white/40 rounded-lg px-6 py-3 shadow-md"
              >
                <p class="text-xl font-medium text-gray-700" dir="rtl">
                  محمد احمد محمد
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div
        :initial="{ opacity: 0, y: 30 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.8, delay: 0.2 }"
        class="backdrop-blur-lg bg-white/80 rounded-2xl shadow-2xl p-8 border border-white/20 hover:shadow-blue-100/50 transition-all duration-500"
      >
        <h2
          class="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-8"
        >
          Monitoring Dashboard
        </h2>
        <div
          v-if="error"
          class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6"
        >
          <p class="text-red-700">
            Error connecting to WebSocket server: {{ error }}
          </p>
          <p class="text-red-600 text-sm mt-1">
            Please ensure the backend server is running.
          </p>
        </div>
        <motion.div
          v-else-if="!isConnected"
          :animate="{ scale: [1, 1.05, 1] }"
          :transition="{ duration: 1, repeat: Infinity }"
          class="bg-blue-50 p-6 rounded-lg flex items-center justify-center"
        >
          <p class="text-blue-700 font-medium">
            Connecting to WebSocket server...
          </p>
        </motion.div>
        <div v-else class="space-y-6">
          <h2 class="text-2xl font-semibold text-blue-800 flex items-center">
            <Icon name="mdi:lightning-bolt" class="w-6 h-6 mr-2" />
            Live Sensor Readings
          </h2>
          <div v-if="sensorData" class="grid gap-6">
            <motion.div
              :initial="{ opacity: 0, x: -20 }"
              :animate="{ opacity: 1, x: 0 }"
              :whileHover="{ scale: 1.02 }"
              :transition="{ duration: 0.3 }"
              class="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-100 shadow-sm"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <Icon
                    name="mdi:thermometer"
                    class="w-8 h-8 text-orange-500"
                  />
                  <span class="text-lg font-medium text-gray-700"
                    >Temperature</span
                  >
                </div>
                <span class="text-2xl font-bold text-orange-600">
                  {{ formatTemperature(sensorData.temperature) }}
                </span>
              </div>
            </motion.div>
            <motion.div
              :initial="{ opacity: 0, x: 20 }"
              :animate="{ opacity: 1, x: 0 }"
              :whileHover="{ scale: 1.02 }"
              :transition="{ duration: 0.3, delay: 0.1 }"
              class="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100 shadow-sm"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <Icon name="mdi:water" class="w-8 h-8 text-blue-500" />
                  <span class="text-lg font-medium text-gray-700"
                    >Water Status</span
                  >
                </div>
                <div class="text-right">
                  <motion.span
                    :animate="
                      sensorData.waterDetected ? { scale: [1, 1.1, 1] } : {}
                    "
                    :transition="{ duration: 0.3 }"
                    :class="[
                      'px-4 py-1 rounded-full text-sm font-semibold mb-2 block',
                      sensorData.waterDetected
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700',
                    ]"
                  >
                    {{
                      sensorData.waterDetected
                        ? "Water Detected!"
                        : "No Water Detected"
                    }}
                  </motion.span>
                </div>
              </div>
            </motion.div>
            <motion.div
              :initial="{ opacity: 0, x: 20 }"
              :animate="{ opacity: 1, x: 0 }"
              :whileHover="{ scale: 1.02 }"
              :transition="{ duration: 0.3, delay: 0.2 }"
              class="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100 shadow-sm"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <Icon
                    name="mdi:water-opacity"
                    class="w-8 h-8 text-purple-500"
                  />
                  <span class="text-lg font-medium text-gray-700"
                    >Turbidity</span
                  >
                </div>
                <div class="text-right">
                  <span class="text-2xl font-bold text-purple-600">
                    {{ formatTurbidity(sensorData.turbidityNTU) }}
                  </span>
                  <div class="flex flex-col items-end gap-1 mt-2">
                    <motion.span
                      v-if="sensorData.status"
                      :animate="{ scale: [1, 1.05, 1] }"
                      :transition="{ duration: 0.3 }"
                      :class="[
                        'px-3 py-1 rounded-full text-xs font-medium',
                        sensorData.status === 'Muddy'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200',
                      ]"
                    >
                      Water Quality: {{ sensorData.status }}
                    </motion.span>
                    <span class="text-xs text-gray-500">
                      Voltage:
                      {{ sensorData?.turbidityVoltage?.toFixed(2) || "N/A" }}V
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          <div
            v-else
            class="bg-blue-50 p-4 rounded-lg text-blue-700 text-center"
          >
            <p>Waiting for data from Arduino...</p>
          </div>
          <motion.div
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.3, delay: 0.2 }"
            class="mt-8 flex items-center justify-between p-4 border-t border-gray-100"
          >
            <span class="text-gray-600">Arduino Connection Status</span>
            <motion.span
              :animate="isArduinoConnected ? { scale: [1, 1.05, 1] } : {}"
              :transition="{ duration: 1, repeat: Infinity }"
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium',
                isArduinoConnected
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-red-100 text-red-700 border border-red-200',
              ]"
            >
              {{ isArduinoConnected ? "Connected" : "Disconnected" }}
            </motion.span>
          </motion.div>
        </div>
      </motion.div>
      <motion.div
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.8, delay: 0.4 }"
        class="mt-12 space-y-8"
      >
        <!-- Tech Stack Section -->
        <div
          class="backdrop-blur-lg bg-white/60 rounded-2xl p-8 shadow-lg border border-white/20"
        >
          <h2
            class="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-6"
          >
            Technology Stack
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Frontend Technologies -->
            <div class="space-y-4">
              <h3 class="text-xl font-semibold text-blue-700 flex items-center">
                <Icon name="mdi:web" class="w-6 h-6 mr-2" />
                Monitoring Software Stack
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <motion.div
                  v-for="tech in frontendTech"
                  :key="tech.name"
                  :whileHover="{ scale: 1.05 }"
                  :whileTap="{ scale: 0.95 }"
                  class="flex items-center p-3 bg-white/50 rounded-lg shadow-sm"
                >
                  <Icon :name="tech.icon" class="w-6 h-6 text-blue-500 mr-2" />
                  <span class="text-gray-700">{{ tech.name }}</span>
                </motion.div>
              </div>
            </div>

            <!-- Hardware Components -->
            <div class="space-y-4">
              <h3 class="text-xl font-semibold text-blue-700 flex items-center">
                <Icon name="mdi:chip" class="w-6 h-6 mr-2" />
                Monitoring Hardware Components
              </h3>
              <div class="space-y-3">
                <motion.div
                  v-for="component in hardwareComponents"
                  :key="component.name"
                  :whileHover="{ scale: 1.02 }"
                  class="flex items-center p-3 bg-white/50 rounded-lg shadow-sm"
                >
                  <Icon
                    :name="component.icon"
                    class="w-6 h-6 text-blue-500 mr-2"
                  />
                  <span class="text-gray-700">{{ component.name }}</span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.8, delay: 0.4 }"
        class="mt-12 text-center relative overflow-hidden"
      >
        <motion.div
          :whileHover="{ scale: 1.02 }"
          class="relative z-10 backdrop-blur-md bg-white/30 rounded-xl px-8 py-6 shadow-lg"
        >
          <p class="text-lg font-medium text-blue-800/70 mb-2">
            © 2024 Water Monitoring System
          </p>
          <p class="text-blue-600 font-medium">Information System Management</p>
          <p class="mt-2 text-blue-500">Course Project for IoT</p>
        </motion.div>
        <div
          class="absolute bottom-0 left-0 right-0 h-24 opacity-30 bg-gradient-to-t from-blue-200 to-transparent"
        ></div>
      </motion.div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { motion } from "motion-v";
import { onMounted, onUnmounted, ref } from "vue";

const WEBSOCKET_URL = "ws://localhost:3001";
const isConnected = ref(false);
const isArduinoConnected = ref(false);
const sensorData = ref<{
  temperature: number | null;
  waterDetected: boolean;
  turbidityRaw: number | null;
  turbidityVoltage: number | null;
  turbidityNTU: number | null;
  status: string | null;
} | null>(null);
const error = ref<string | null>(null);
const rawMessage = ref<string | null>(null);
let socket: WebSocket | null = null;
function connectWebSocket() {
  console.log(`Attempting to connect to WebSocket: ${WEBSOCKET_URL}`);
  error.value = null;
  isConnected.value = false;
  isArduinoConnected.value = false;
  sensorData.value = null;
  try {
    socket = new WebSocket(WEBSOCKET_URL);
    socket.onopen = () => {
      console.log("WebSocket connection established.");
      isConnected.value = true;
      error.value = null;
    };
    socket.onmessage = (event) => {
      rawMessage.value = event.data;
      try {
        const message = JSON.parse(event.data);
        if (message.type === "status") {
          console.log("Received status:", message);
          isArduinoConnected.value = !!message.connected;
          if (!isArduinoConnected.value) {
            sensorData.value = null;
          }
        } else if (message.type === "data") {
          if (typeof message.data === "string") {
            try {
              const parsedSensorData = JSON.parse(message.data);
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
                  turbidityRaw:
                    parsedSensorData.turbidityRaw !== undefined
                      ? Number(parsedSensorData.turbidityRaw)
                      : null,
                  turbidityVoltage:
                    parsedSensorData.turbidityVoltage !== undefined
                      ? Number(parsedSensorData.turbidityVoltage)
                      : null,
                  turbidityNTU:
                    parsedSensorData.turbidityNTU !== undefined
                      ? Number(parsedSensorData.turbidityNTU)
                      : null,
                  status: parsedSensorData.status || null,
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
    };
  } catch (e) {
    console.error("Failed to create WebSocket:", e);
    error.value = "Failed to initialize WebSocket connection.";
  }
}
onMounted(() => {
  connectWebSocket();
});
onUnmounted(() => {
  if (socket) {
    console.log("Closing WebSocket connection.");
    socket.close();
  }
});
function formatTemperature(temp: number | null): string {
  if (temp === null || temp === undefined) {
    return "N/A";
  }
  return `${temp.toFixed(1)} °C`;
}

function formatTurbidity(ntu: number | null): string {
  if (ntu === null || ntu === undefined) {
    return "N/A";
  }
  return `${ntu.toFixed(1)} NTU`;
}

const frontendTech = [
  { name: "Nuxt.js", icon: "simple-icons:nuxtdotjs" },
  { name: "Tailwind CSS", icon: "simple-icons:tailwindcss" },
  { name: "WebSocket", icon: "mdi:connection" },
  { name: "Motion One", icon: "mdi:animation" },
  { name: "Iconify", icon: "tabler:icons" },
  { name: "TypeScript", icon: "simple-icons:typescript" },
];

const hardwareComponents = [
  { name: "Arduino UNO", icon: "file-icons:arduino" },
  {
    name: "Non-Contact Water Level Sensor (XYC-Y25-NPN)",
    icon: "mdi:water-check",
  },
  {
    name: "Thermal WaterProof Temperature Sensor (DS18B20)",
    icon: "mdi:thermometer",
  },
  { name: "Turbidity Sensor", icon: "mdi:water-opacity" },
];
</script>
<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
@keyframes wave {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}
.animate-wave {
  animation: wave 8s infinite linear;
}
@font-face {
  font-family: "Noto Sans Arabic";
  src: url("https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap");
}
[dir="rtl"] {
  font-family: "Noto Sans Arabic", sans-serif;
  letter-spacing: 0.5px;
}
.developer-card {
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition-property: all;
  transition-duration: 500ms;
}
.developer-card:hover {
  transform: translateY(-0.25rem);
  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color),
    0 4px 6px -4px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000),
    var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  background-color: rgb(255 255 255 / 0.5);
}
.text-gradient {
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-fill-color: transparent;
}
@keyframes float-bubble {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(10px, -15px) scale(1.1);
  }
  50% {
    transform: translate(-5px, -25px) scale(0.9);
  }
  75% {
    transform: translate(-15px, -15px) scale(1.05);
  }
}
.bubble {
  position: absolute;
  border-radius: 9999px;
  background-color: rgb(191 219 254 / 0.2);
  backdrop-filter: blur(4px);
  width: 100px;
  height: 100px;
  animation: float-bubble 15s infinite ease-in-out;
  z-index: 1;
}
.delay-2 {
  animation-delay: -5s;
  right: 15%;
  top: 25%;
}
.delay-4 {
  animation-delay: -10s;
  left: 25%;
  top: 45%;
}
@media (max-width: 640px) {
  .bubble {
    width: 60px;
    height: 60px;
  }

  .text-6xl {
    font-size: 2.25rem;
    line-height: 2.5rem;
  }
}

/* Rain Animation */
.rain-container {
  overflow: hidden;
  z-index: 0;
}

.rain-drop {
  position: absolute;
  width: 2px;
  height: 20px;
  left: var(--position);
  top: -20px;
  background: linear-gradient(transparent, rgba(124, 177, 255, 1));
  animation: rain var(--duration) linear infinite;
  animation-delay: var(--delay);
}

@keyframes rain {
  0% {
    transform: translateY(-20px) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 0.5;
  }
  95% {
    opacity: 0.4;
  }
  100% {
    transform: translateY(100vh) scale(0.8);
    opacity: 0;
  }
}

/* Make content container have higher z-index */
.max-w-3xl {
  position: relative;
  z-index: 2;
}

/* Bubbles Container and Bubbles */
.bubbles-container {
  z-index: 1;
  overflow: hidden;
}

.bubble {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 9999px;
  background-color: rgba(191, 219, 254, 0.2);
  backdrop-filter: blur(4px);
  animation: float-bubble 15s infinite ease-in-out;
}

@media (max-width: 768px) {
  .bubble {
    width: 60px;
    height: 60px;
    opacity: 0.4;
  }

  /* Adjust bubble positions for mobile */
  .bubbles-container .bubble:nth-child(1) {
    right: 5%;
    top: 10%;
  }

  .bubbles-container .bubble:nth-child(2) {
    left: 8%;
    top: 30%;
  }

  .bubbles-container .bubble:nth-child(3) {
    right: 15%;
    top: 50%;
  }
}

/* Content z-index adjustments */
.max-w-4xl {
  position: relative;
  z-index: 10;
}

.backdrop-blur-lg {
  position: relative;
  z-index: 11;
}

/* Rain stays behind everything */
.rain-container {
  z-index: 0;
}

/* Remove old delay classes as we're using direct positioning */
</style>
