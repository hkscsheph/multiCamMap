const express = require('express');
const axios = require('axios');
const app = express();

// Set your camera details here
const cameras = {
    cam1: { url: 'http://192.168.120.3/ISAPI/Streaming/channels/101/httpPreview', user: 'admin', pass: 'ictipcam1' },
    cam2: { url: 'http://192.168.120.4/ISAPI/Streaming/channels/101/httpPreview', user: 'admin', pass: 'ictipcam1' },
    cam3: { url: 'http://192.168.120.7/ISAPI/Streaming/channels/101/httpPreview', user: 'admin', pass: 'ictipcam1' }
};

app.get('/stream/:id', async (req, res) => {
    const cam = cameras[`cam${req.params.id}`];
    if (!cam) return res.status(404).send("Camera not found");

    res.setHeader('Access-Control-Allow-Origin', '*'); // Fixes CORS
    
    try {
        const response = await axios({
            method: 'get',
            url: cam.url,
            responseType: 'stream',
            auth: { username: cam.user, password: cam.pass },
            timeout: 10000
        });

        // Pass the original content type (multipart/x-mixed-replace) to the browser
        res.setHeader('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
    } catch (err) {
        console.error("Error connecting to camera:", err.message);
        res.status(500).send("Camera Connection Error");
    }
});

app.listen(3000, () => console.log('Proxy active on http://localhost:3000/stream/1, /2, and /3'));