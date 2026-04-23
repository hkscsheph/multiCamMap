const express = require('express');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const dgram = require('dgram');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// UDP socket to receive CSI data from ESP32
const udpSocket = dgram.createSocket('udp4');
const UDP_PORT = 5000;

// Simple state to store the "last known" position from WiFi
let lastWiFiPosition = { x: 0, y: 0, strength: 0, active: false };

// WebSocket connection for frontend
wss.on('connection', (ws) => {
    console.log('Frontend connected to WiFi CSI WebSocket');
    
    // Send initial state
    ws.send(JSON.stringify({ type: 'init', data: 'Connected to CSI Stream' }));
});

// Broadcast CSI updates to all connected frontends
function broadcastPosition(pos) {
    const message = JSON.stringify({ type: 'csi_update', data: pos });
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Handle incoming UDP packets from ESP32
udpSocket.on('message', (msg, rinfo) => {
    // Note: Raw CSI data can be large. For this implementation, 
    // we assume the ESP32 is sending a processed signal strength 
    // or a simple coordinate if it's doing edge processing.
    // If it's sending raw CSI, you'd need a more complex parser here.
    
    try {
        const data = JSON.parse(msg.toString());
        
        // Example logic: if data contains x, y, map it
        if (data.x !== undefined && data.y !== undefined) {
            lastWiFiPosition = {
                x: data.x,
                y: data.y,
                strength: data.strength || 100,
                active: true,
                timestamp: Date.now()
            };
            broadcastPosition(lastWiFiPosition);
        } else if (data.amplitude) {
            // If it's sending raw amplitude (array), we could do basic motion detection
            // or fingerprint matching here. For now, let's just log presence.
            const avgAmp = data.amplitude.reduce((a, b) => a + b, 0) / data.amplitude.length;
            console.log(`CSI Packet from ${rinfo.address}: Avg Amp ${avgAmp.toFixed(2)}`);
        }
    } catch (e) {
        // Fallback for non-JSON or raw binary CSI data
        // console.log(`Received raw CSI bytes: ${msg.length} from ${rinfo.address}`);
    }
});

udpSocket.on('listening', () => {
    const address = udpSocket.address();
    console.log(`UDP CSI Listener active on ${address.address}:${address.port}`);
});

udpSocket.bind(UDP_PORT);

// Set your camera details here (legacy support)
const cameras = {
    cam1: { url: 'http://192.168.120.5/ISAPI/Streaming/channels/101/httpPreview', user: 'admin', pass: 'ictipcam1' },
    cam2: { url: 'http://192.168.120.10/ISAPI/Streaming/channels/101/httpPreview', user: 'admin', pass: 'ictipcam1' },
    cam3: { url: 'http://192.168.120.11/ISAPI/Streaming/channels/101/httpPreview', user: 'admin', pass: 'ictipcam1' }
};

// Legacy endpoint
app.get('/stream/:id', async (req, res) => {
    const cam = cameras[`cam${req.params.id}`];
    if (!cam) return res.status(404).send("Camera not found");

    res.setHeader('Access-Control-Allow-Origin', '*'); 
    
    try {
        const response = await axios({
            method: 'get',
            url: cam.url,
            responseType: 'stream',
            auth: { username: cam.user, password: cam.pass },
            timeout: 10000
        });

        res.setHeader('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
    } catch (err) {
        console.error("Error connecting to camera:", err.message);
        res.status(500).send("Camera Connection Error");
    }
});

// Generic MJPEG Proxy
app.get('/mjpeg-proxy', async (req, res) => {
    const streamUrl = req.query.url;
    if (!streamUrl) return res.status(400).send("URL required");

    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        const response = await axios({
            method: 'get',
            url: streamUrl,
            responseType: 'stream',
            timeout: 10000
        });

        res.setHeader('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
    } catch (err) {
        console.error("Error proxying MJPEG:", err.message);
        res.status(500).send("Proxy Error");
    }
});

// RTSP to MJPEG Proxy (Requires ffmpeg installed on the system)
app.get('/rtsp-proxy', (req, res) => {
    const rtspUrl = req.query.url;
    if (!rtspUrl) return res.status(400).send("RTSP URL required");

    console.log(`Starting RTSP proxy for: ${rtspUrl}`);

    res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=ffmpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const command = ffmpeg(rtspUrl)
        .inputOptions([
            '-rtsp_transport tcp',
            '-re'
        ])
        .outputOptions([
            '-f mpjpeg',
            '-q:v 3',
            '-boundary ffmpeg'
        ])
        .on('start', (commandLine) => {
            console.log('Spawned Ffmpeg with command: ' + commandLine);
        })
        .on('error', (err) => {
            console.error('Ffmpeg error:', err.message);
            if (!res.headersSent) {
                res.status(500).send("RTSP Proxy Error: " + err.message);
            }
            res.end();
        })
        .on('end', () => {
            console.log('Ffmpeg processing finished');
            res.end();
        });

    command.pipe(res, { end: true });

    req.on('close', () => {
        console.log('Client closed connection, stopping ffmpeg');
        command.kill();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Proxy active on http://localhost:${PORT}`);
    console.log(`- MJPEG Legacy: /stream/:id`);
    console.log(`- MJPEG Generic: /mjpeg-proxy?url=...`);
    console.log(`- RTSP Proxy: /rtsp-proxy?url=rtsp://...`);
    console.log(`- WiFi CSI UDP: Port ${UDP_PORT}`);
});
