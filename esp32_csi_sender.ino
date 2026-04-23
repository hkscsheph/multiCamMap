#include <WiFi.h>
#include <WiFiUdp.h>

// --- Configuration ---
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* host     = "192.168.1.XX"; // Your computer's IP address
const int port       = 5000;

WiFiUDP udp;

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // 1. Simulate finding a position (In a real app, you'd calculate this from CSI)
  int x = 400 + random(-50, 50); // Move around a center point
  int y = 300 + random(-50, 50);
  int strength = random(70, 95);

  // 2. Format the JSON packet
  // The proxy.js expects: {"x": number, "y": number, "strength": number}
  String json = "{\"x\":" + String(x) + ",\"y\":" + String(y) + ",\"strength\":" + String(strength) + "}";

  // 3. Send via UDP
  udp.beginPacket(host, port);
  udp.print(json);
  udp.endPacket();

  Serial.println("Sent: " + json);

  // 4. Placeholder for Raw CSI Data
  // If you use an ESP32 CSI library, you would capture the buffer here 
  // and send it as a binary blob or hex string.
  
  delay(100); // Send updates 10 times per second
}
