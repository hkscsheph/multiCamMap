const express = require('express');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const app = express();

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
            '-boundary_marker ffmpeg'
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
app.listen(PORT, () => {
    console.log(`Proxy active on http://localhost:${PORT}`);
    console.log(`- MJPEG Legacy: /stream/:id`);
    console.log(`- MJPEG Generic: /mjpeg-proxy?url=...`);
    console.log(`- RTSP Proxy: /rtsp-proxy?url=rtsp://...`);
});
