const express = require("express");
const fs = require("fs");
const chokidar = require("chokidar");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static("."));
app.use(express.json());

const EXPORTS_DIR =
  "D:/AntiBeltMeasure/CoreJ/Plugins/Temp/CurioDataScience/exports";
let defaultLeagueName = "Phrecia 2.0";
let clients = [];
let allJsonFiles = [];
let parsedData = [];
let fileStats = {
  exists: false,
  fileCount: 0,
  lastModified: null,
  totalSize: 0,
};

function parseJsonData(jsonText, sourcePath = null) {
  try {
    const cleaned = String(jsonText)
      .replace(/^\uFEFF/, "")
      .replace(/^[\u0000-\u001F]+/, "");
    const json = JSON.parse(cleaned);
    const items = [];
    if (!json.rewards || !json.rewards.rewardData) return items;
    const metadata = {
      leagueName: json.leagueName || defaultLeagueName,
      zoneName: json.zoneName || "",
      partial: json.partial || false,
      areaLevel: json.areaLevel || 83,
      heistId: json.id || null,
    };

    json.rewards.rewardData.forEach((reward) => {
      items.push({
        DisplayName: reward.displayName || "",
        BaseName: reward.baseName || "",
        Rarity: reward.rarity || "",
        LeagueName: metadata.leagueName,
        ZoneName: metadata.zoneName,
        Partial: metadata.partial,
        AreaLevel: metadata.areaLevel,
        HeistId: metadata.heistId,
      });
    });
    return items;
  } catch (error) {
    console.error(
      `Error parsing JSON${sourcePath ? ` in ${sourcePath}` : ""}:`,
      error,
    );
    return [];
  }
}

function loadAllJsonFiles() {
  try {
    if (!fs.existsSync(EXPORTS_DIR)) {
      console.error(`Directory not found for exports ${EXPORTS_DIR}`);
      fileStats.exists = false;
      return;
    }

    const jsonFiles = [];
    const findJsonFiles = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          findJsonFiles(filePath);
        } else if (path.extname(file) === ".json") {
          jsonFiles.push(filePath);
        }
      });
    };

    findJsonFiles(EXPORTS_DIR);
    const filesRead = jsonFiles
      .map((filePath) => {
        try {
          const raw = fs.readFileSync(filePath, "utf8");
          const cleaned = String(raw)
            .replace(/^\uFEFF/, "")
            .replace(/^[\u0000-\u001F]+/, "");
          const trimmed = cleaned.trim();
          if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
            console.warn(`Skipping non-JSON file: ${filePath}`);
            return null;
          }
          return { filePath, content: cleaned };
        } catch (error) {
          console.error(`Error reading file path: ${filePath}`, error.message);
          return null;
        }
      })
      .filter((entry) => entry !== null);

    allJsonFiles = filesRead.map((f) => f.content);

    parsedData = [];
    filesRead.forEach(({ filePath, content }) => {
      const items = parseJsonData(content, filePath);
      parsedData.push(...items);
    });

    let totalSize = 0;
    let latestModified = null;
    jsonFiles.forEach((filePath) => {
      try {
        const stat = fs.statSync(filePath);
        totalSize += stat.size;
        if (!latestModified || stat.mtime > latestModified) {
          latestModified = stat.mtime;
        }
      } catch (error) {
        console.error(`Error stat: ${filePath}`, error.message);
      }
    });

    fileStats = {
      exists: true,
      fileCount: allJsonFiles.length,
      lastModified: latestModified,
      totalSize: totalSize,
    };

    console.log(
      `Loaded: ${allJsonFiles.length} JSON files (${Math.round(totalSize / 1024)}KB)`,
    );
  } catch (error) {
    console.error("Error loading JSON Files", error);
    fileStats.exists = false;
  }
}

function setupFileWatcher() {
  const watcher = chokidar.watch(path.join(EXPORTS_DIR, "**/*.json"), {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100,
    },
  });

  watcher.on("add", (filePath) => {
    console.log(`New file: ${path.relative(EXPORTS_DIR, filePath)}`);
    reloadAndNotify();
  });

  watcher.on("change", (filePath) => {
    console.log(`File changed: ${path.relative(EXPORTS_DIR, filePath)}`);
    reloadAndNotify();
  });

  watcher.on("unlink", (filePath) => {
    console.log(`File deleted: ${path.relative(EXPORTS_DIR, filePath)}`);
    reloadAndNotify();
  });

  watcher.on("error", (error) => {
    console.error("Watcher error: ", error);
  });

  return watcher;
}

function reloadAndNotify() {
  loadAllJsonFiles();

  const timeStr = new Date().toLocaleTimeString();
  console.log(
    `Data reloaded at: ${timeStr}, ${allJsonFiles.length} files loaded`,
  );

  clients.forEach((client) => {
    client.write(
      `data: ${JSON.stringify({ type: "update", data: allJsonFiles, stats: fileStats })}\n\n`,
    );
  });
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    directory: EXPORTS_DIR,
    fileExists: fileStats.exists,
    fileCount: fileStats.fileCount,
    totalSize: fileStats.totalSize,
    lastModified: fileStats.lastModified,
    clientsConnected: clients.length,
    totalItems: parsedData.length,
  });
});

app.get("/api/files", (req, res) => {
  if (!fileStats.exists) {
    return res.status(404).json({ error: "no files found/loaded" });
  }
  res.json({
    content: allJsonFiles,
    stats: fileStats,
  });
});

app.get("/api/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (fileStats.exists) {
    res.write(
      `data: ${JSON.stringify({
        type: "init",
        data: allJsonFiles,
        stats: fileStats,
      })}\n\n`,
    );
  } else {
    res.write(
      `data: ${JSON.stringify({
        type: "error",
        message: "No files found in exports dir",
      })}\n\n`,
    );
  }

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

app.get("/api/obs/stats", (req, res) => {
  try {
    const leagueFilter = req.query.league;
    const itemsFilter = req.query.items
      ? req.query.items.split(",").map((i) => i.trim())
      : [];
    let filteredData = parsedData;
    if (leagueFilter && leagueFilter !== "All") {
      filteredData = parsedData.filter(
        (item) => item.LeagueName === leagueFilter,
      );
    }
    const totalItems = filteredData.length;
    const wingsRan = Math.round(totalItems / 5);
    const itemCounts = {};
    if (itemsFilter.length > 0) {
      itemsFilter.forEach((itemName) => {
        itemCounts[itemName] = 0;
      });
      filteredData.forEach((item) => {
        itemsFilter.forEach((itemName) => {
          if (item.DisplayName === itemName || item.BaseName === itemName) {
            itemCounts[itemName]++;
          }
        });
      });
    }
    const response = {
      wingsRan: wingsRan,
      itemsSeen: totalItems,
      league: leagueFilter || defaultLeagueName,
      itemCounts: itemCounts,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    console.error("Error in OBS stats endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/obs/stats", (req, res) => {
  try {
    const { league, items } = req.body;
    let filteredData = parsedData;
    if (league && league !== "All") {
      filteredData = parsedData.filter((item) => item.LeagueName === league);
    }
    const totalItems = filteredData.length;
    const wingsRan = Math.round(totalItems / 5);
    const itemCounts = {};
    if (items && Array.isArray(items) && items.length > 0) {
      items.forEach((itemName) => {
        itemCounts[itemName] = 0;
      });
      filteredData.forEach((item) => {
        items.forEach((itemName) => {
          if (item.DisplayName === itemName || item.BaseName === itemName) {
            itemCounts[itemName]++;
          }
        });
      });
    }
    const response = {
      wingsRan: wingsRan,
      itemsSeen: totalItems,
      league: league || defaultLeagueName,
      itemCounts: itemCounts,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    console.error("Error in OBS stats endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

loadAllJsonFiles();
const watcher = setupFileWatcher();

app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
  console.log(`Watcher pointed at: ${EXPORTS_DIR}`);
  console.log(`API Endpoints:`);
  console.log(`   http://localhost:${PORT}/api/health`);
  console.log(`   http://localhost:${PORT}/api/files`);
  console.log(`   http://localhost:${PORT}/api/stream`);
  console.log(`   http://localhost:${PORT}/api/obs/stats`);
  console.log(`   OBS Overlay:`);
  console.log(`   http://localhost:${PORT}/obs/index.html`);
});

process.on("SIGINT", () => {
  console.log("\n Shutting down server");
  watcher.close();
  clients.forEach((client) => client.end());
  process.exit(0);
});
