const express = require("express");
const fs = require("fs");
const chokidar = require("chokidar");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static("."));

let EXPORTS_BASE_PATH_PC =
  "D:/AntiBeltMeasure/CoreJ/Plugins/Temp/CurioDataScience/exports";
let EXPORTS_BASE_PATH = "C:/Users/jessi/OneDrive/Desktop/transfer/exports";
let currentLeague = "Phrecia 2.0"; // Default override for now
let currentZone = null;

let clients = [];
let watcher = null;
let allWingsData = [];

function loadAllWings(leaguePath) {
  allWingsData = [];

  if (!fs.existsSync(leaguePath)) {
    console.log(`League path does not exist: ${leaguePath}`);
    return;
  }

  try {
    const zones = fs
      .readdirSync(leaguePath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    console.log(`Found ${zones.length} zone directories`);

    zones.forEach((zone) => {
      const zonePath = path.join(leaguePath, zone);
      const files = fs
        .readdirSync(zonePath)
        .filter((file) => file.endsWith(".json"));
      console.log(`${zone}: ${files.length} wing files`);

      files.forEach((file) => {
        try {
          const filePath = path.join(zonePath, file);
          const content = fs.readFileSync(filePath, "utf8");
          const wingData = JSON.parse(content);
        } catch (error) {
          console.error(`Error loading ${file}:`, error.message);
        }
      });
    });
    console.log(
      `Loaded ${allWingsData.length} total wings from ${currentLeague}`,
    );
  } catch (error) {
    console.error("Error loading wings:", error);
  }
}

function setupFileWatcher() {
  if (watcher) {
    watcher.close();
  }
  const leaguePath = path.join(EXPORTS_BASE_PATH, currentLeague);

  if (!fs.existsSync(leaguePath)) {
    console.error(`League path not found: ${leaguePath}`);
    console.log(`Creating directory...`);
    fs.mkdir(leaguePath, { recursive: true });
  }

  loadAllWings(leaguePath);

  const watchPattern = path.join(leaguePath, "**/*.json");

  watcher = chokidar.watch(watchPattern, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100,
    },
  });

  watcher.on("add", (filePath) => {
    handleFileChange(filePath, "added");
  });

  watcher.on("change", (filePath) => {
    handleFileChange(filePath, "changed");
  });

  watcher.on("error", (error) => {
    console.error("File watcher error: ", error);
  });

  console.log(`Watching: ${watchPattern}`);
}

function handleFileChange(filePath, changeType) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const wingData = JSON.parse(content);

    const existingIndex = allWingsData.findIndex((w) => w.id === wingData.id);
    if (existingIndex >= 0) {
      allWingsData[existingIndex] = wingData;
    } else {
      allWingsData.push(wingData);
    }

    const relativePath = path.relative(EXPORTS_BASE_PATH, filePath);
    console.log(
      `File: ${changeType}: ${relativePath} (${new Date().toLocaleTimeString()})`,
    );

    broadcastUpdate({
      type: "update",
      changeType: changeType,
      file: relativePath,
      data: allWingsData,
      stats: {
        totalWings: allWingsData.length,
        totalItems: allWingsData.reduce(
          (sum, wing) => sum + (wing.rewards?.rewardData?.length || 0),
          0,
        ),
        modified: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(`Error processing ${changeType} file`, error.message);
  }
}

function broadcastUpdate(updateData) {
  const message = `data: ${JSON.stringify(updateData)}\n\n`;
  clients.forEach((client) => {
    try {
      client.write(message);
    } catch (error) {
      console.error("Error broadcasting to client:", error.message);
    }
  });
}

app.get("/api/health", (req, res) => {
  const leaguePath = path.join(EXPORTS_BASE_PATH, currentLeague);
  res.json({
    status: "ok",
    league: currentLeague,
    exportsPath: leaguePath,
    pathExists: fs.existsSync(leaguePath),
    totalWings: allWingsData.length,
    totalItems: allWingsData.at.reduce(
      (sum, wing) => sum + (wing.rewards?.rewardData?.length || 0),
      0,
    ),
    clientsConnected: clients.length,
  });
});

app.get("/api/wings", (req, res) => {
  res.json({
    league: currentLeague,
    wings: allWingsData,
    totalWings: allWingsData.length,
    totalItems: allWingsData.at.reduce(
      (sum, wing) => sum + (wing.rewards?.rewardData?.length || 0),
      0,
    ),
  });
});

app.post("/api/league", express.json(), (req, res) => {
  const { league } = req.body;

  if (!league) {
    return res.status(400).json({ error: "League name required" });
  }

  console.log(
    `Attempting to swap league from ${currentLeague} to ${league}...`,
  );
  currentLeague = league;
  console.log(`Current league successfully swapped to: ${currentLeague}`);

  setupFileWatcher();

  res.json({
    status: "ok",
    league: currentLeague,
    totalWings: allWingsData.length,
  });
});

app.get("/api/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.write(
    `data: ${JSON.stringify({
      type: "init",
      data: allWingsData,
      stats: {
        league: currentLeague,
        totalWings: allWingsData.length,
        totalItems: allWingsData.at.reduce(
          (sum, wing) => sum + (wing.rewards?.rewardData?.length || 0),
          0,
        ),
        modified: new Date().toISOString(),
      },
    })}\n\n`,
  );

  const clientId = Date.now();
  clients.push(res);
  console.log(`Client connected: ${clientId}, (Total: ${clients.length})`);

  req.on("close", () => {
    clients = clients.filter((client) => client !== res);
    console.log(
      `Client disconnected: ${clientId}, (Remaining: ${clients.length})`,
    );
  });
});

app.get("/api/leagues", (res, res) => {
  try {
    if (!fs.existsSync(EXPORTS_BASE_PATH)) {
      return res.json({ leagues: [] });
    }

    const leagues = fs
      .readdirSync(EXPORTS_BASE_PATH, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    res.json({ leagues, current: currentLeague });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

setupFileWatcher();

app.listen(PORT, () => {
  console.log(`Curio Data Science`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Base Path: ${EXPORTS_BASE_PATH}`);
  console.log(`Current League: ${currentLeague}`);
  console.log(`Wings: ${allWingsData.length} loaded`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`API Endpoints`);
  console.log(`GET /api/health - Server health check`);
  console.log(`GET /api/wings - Get all wings data`);
  console.log(`GET /api/leagues - List of all current available leagues`);
  console.log(`POST /api/league - Change current league`);
  console.log(`GET /api/stream - SSE Event stream`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});

process.on("SIGINT", () => {
  console.log(`Shutting down server...`);
  if (watcher) {
    watcher.close();
  }

  clients.forEach((client) => client.end());
  process.exit(0);
});
