const express = require('express');
const fs = require('fs');
const chokidar = require('chokidar');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('.'));

const CSV_PATH = 'D:/AntiBeltMeasure/CoreJ/Plugins/Temp/CurioDataScience/heist_rewards.csv';

let fileContent = '';
let clients = [];
let fileStats = {};

function initializeFileSystem() {
    try {
        if (fs.existsSync(CSV_PATH)) {
            fileContent = fs.readFileSync(CSV_PATH, 'utf8');
            const stats = fs.statSync(CSV_PATH);
            fileStats = {
                size: stats.size,
                modified: stats.mtime,
                exists: true
            };
            console.log(`✓ File loaded: ${CSV_PATH} (${fileStats.size} bytes)`);
        } else {
            console.error(`✗ File not found: ${CSV_PATH}`);
            fileStats.exists = false;
        }
    } catch (error) {
        console.error('Error loading file:', error);
        fileStats.exists = false;
    }
}

function setupFileWatcher() {
    const watcher = chokidar.watch(CSV_PATH, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 1000,
            pollInterval: 100
        }
    });

    watcher.on('change', (filePath) => {
        try {
            const newContent = fs.readFileSync(filePath, 'utf8');
            const stats = fs.statSync(filePath);
            
            if (newContent !== fileContent) {
                fileContent = newContent;
                fileStats = {
                    size: stats.size,
                    modified: stats.mtime,
                    exists: true
                };
                
                console.log(`📄 File updated: ${path.basename(filePath)} (${new Date().toLocaleTimeString()})`);
                
                clients.forEach(client => {
                    client.write(`data: ${JSON.stringify({
                        type: 'update',
                        data: fileContent,
                        stats: fileStats
                    })}\n\n`);
                });
            }
        } catch (error) {
            console.error('Error reading updated file:', error);
        }
    });

    watcher.on('error', (error) => {
        console.error('File watcher error:', error);
    });

    return watcher;
}

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        file: path.basename(CSV_PATH),
        fileExists: fileStats.exists,
        fileSize: fileStats.size,
        lastModified: fileStats.modified,
        clientsConnected: clients.length
    });
});

app.get('/api/file', (req, res) => {
    if (!fileStats.exists) {
        return res.status(404).json({ error: 'File not found' });
    }
    res.json({
        content: fileContent,
        stats: fileStats
    });
});

app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (fileStats.exists) {
        res.write(`data: ${JSON.stringify({
            type: 'init',
            data: fileContent,
            stats: fileStats
        })}\n\n`);
    } else {
        res.write(`data: ${JSON.stringify({
            type: 'error',
            message: 'File not found'
        })}\n\n`);
    }
    
    const clientId = Date.now();
    clients.push(res);
    console.log(`Client connected: ${clientId} (Total: ${clients.length})`);
    
    req.on('close', () => {
        clients = clients.filter(client => client !== res);
        console.log(`Client disconnected: ${clientId} (Remaining: ${clients.length})`);
    });
});

initializeFileSystem();
const watcher = setupFileWatcher();

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📁 Watching: ${CSV_PATH}`);
    console.log(`📊 API endpoints:`);
    console.log(`   http://localhost:${PORT}/api/health`);
    console.log(`   http://localhost:${PORT}/api/file`);
    console.log(`   http://localhost:${PORT}/api/stream`);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    watcher.close();
    clients.forEach(client => client.end());
    process.exit(0);
});