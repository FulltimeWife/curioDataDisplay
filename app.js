import { DataLoader } from "./modules/dataLoader.js";
import { ChartManager } from "./modules/chartManager.js";
import { FileWatcher } from "./modules/fileWatcher.js";
import { StatsDisplay } from "./components/StatsDisplay.js";
import { ErrorHandler } from "./components/ErrorHandler.js";

class HeistAnalyzer {
  constructor() {
    this.dataLoader = new DataLoader();
    this.chartManager = new ChartManager();
    this.fileWatcher = new FileWatcher();
    this.statsDisplay = new StatsDisplay("statsDisplay");
    this.errorHandler = new ErrorHandler();

    this.currentLeague = null;
    this.availableLagues = [];

    this.initialize();
  }

  async initialize() {
    this.updateStatus("offline");
    this.setupEventHandlers();
    this.createLeagueSelector();

    await this.checkServerHealth();
    await this.loadAvailableLeagues();

    this.fileWatcher.connect();
    this.setupFileWatcherCallbacks();
  }

  async loadAvailableLeagues() {
    try {
      const response = await fetch("http://localhost:3000/api/leagues");
      const data = await response.json();

      this.availableLagues = data.leagues || [];
      this.currentLeague = data.current;

      this.updateLeagueSelector();
      this.updateLeagueDisplay();
    } catch (error) {
      console.error("Error loading leagues: ", error);
    }
  }

  createLeagueSelector() {
    const statusBar = document.querySelector(".status-bar");
    if (!statusBar) return;

    const leagueContainer = document.createElement("div");
    leagueContainer.style.cssText = `
      display: flex;
      align:items: center;
      gap: 10px;
    `;

    const label = document.createElement("label");
    label.textContent = "League: ";
    label.style.cssText = `
      color: white;
      font-weight: 500;
    `;

    const select = document.createElement("select");
    select.id = "leagueSelector";
    select.style.cssText = `
      padding: 6px 12px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      font-size: 0.9rem;
    `;

    select.addEventListener("change", (e) => {
      this.switchLeague(e.target.value);
    });

    leagueContainer.appendChild(label);
    leagueContainer.appendChild(select);
    statusBar.appendChild(leagueContainer);
  }

  updateLeagueSelector() {
    const select = document.getElementById("leagueSelector");
    if (!select) return;

    select.innerHTML = "";

    this.availableLeagues.forEach((league) => {
      const option = document.createElement("option");
      option.value = league;
      option.textContent = league;
      option.selected = league === this.currentLeague;
      select.appendChild(option);
    });
  }

  async switchLeague(leagueName) {
    try {
      const response = await fetch("http://localhost:/api/league", {
        method: "POST",
        headers: {
          "Content=Type": "application/json",
        },
        body: JSON.stringify({ league: leagueName }),
      });

      const data = await response.json();
      if (data.status === "ok") {
        this.currentLeague = leagueName;
        this.updateLeagueDisplay();
        this.errorHandler.showError(
          `Switched to league: ${leagueName} (${data.totalWings} wings)`,
          "success",
        );
      }
    } catch (error) {
      this.errorHandler.showError(
        `Failed to switch league: ${error.message}`,
        "error",
      );
    }
  }

  updateLeagueDisplay() {
    const leagueStatus = document.getElementById("leagueStatus");
    if (leagueStatus && this.currentLeague) {
      leagueStatus.textContent = `League: ${this.currentLeague}`;
    }
  }

  setupEventHandlers() {
    const checkHealthBtn = document.createElement("button");
    checkHealthBtn.textContent = "Check Server Health";
    checkHealthBtn.style.cssText = `
      margi: 10px;
      padding: 8px 16px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      `;
    checkHealthBtn.onclick = () => this.checkServerHealth();

    const statusBar = document.querySelector(".status-bar");
    if (statusBar) {
      statusBar.appendChild(checkHealthBtn);
    }
  }

  async checkServerHealth() {
    try {
      const health = await this.fileWatcher.checkHealth();
      if (health.status === "ok") {
        this.updateStatus("online");
        this.currentLeague = health.league;
        this.errorHandler.showError(
          `Connected to server, League: ${health.league} | Wings: ${health.totalWings} | Items: ${health.totalItems}`,
          "success",
        );
      } else {
        this.updateStatus("offline");
        this.errorHandler.showError("Server is not responding", "error");
      }
    } catch (error) {
      this.updateStatus("offline");
      this.errorHandler.showError(
        "Cannot connect to srever, Make sure server is online.",
        "error",
      );
    }
  }

  setupFileWatcherCallbacks() {
    this.fileWatcher.onConnect(() => {
      this.updateStatus("online");
      this.errorHandler.clearErrors();
    });

    this.fileWatcher.onError((message) => {
      this.updateStatus("offline");
      this.errorHandler.showError(message, "error");
    });

    this.fileWatcher.onUpdate((data) => {
      this.handleFileUpdate(data);
    });
  }

  handleFileUpdate(data) {
    try {
      this.updateStatus("online");

      if (data.type === "error") {
        this.errorHandler.showError(data.message, "error");
        return;
      }

      if (data.stats) {
        this.updateFileStatus(data.stats);
      }

      this.dataLoader.loadJSON(data.data);
      const stats = this.dataLoader.getStats();

      this.statsDisplay.update(stats);
      this.createCharts();

      const timeStr = new Date().toLocaleTimeString();
      document.getElementById("updateTime").textContent =
        `Last Update: ${timeStr}`;

      if (data.changeType) {
        console.log(
          `${data.changeType === "added" ? "Added" : "Changed"} ${data.file} at ${timeStr}`,
        );
      }

      console.log(
        `Data updated: ${stats.totalItems} items frm ${stats.wingStats?.totalWings || 0} wings`,
      );
    } catch (error) {
      console.error("Error processing file update: ", error);
      this.errorHandler.showError(
        "Error Processing data: " + error.message,
        "error",
      );
    }
  }

  createCharts() {
    this.chartManager.destroyAll();

    this.chartManager.createReplicaChart(this.dataLoader.getReplicaItems());
    this.chartManager.createUniqueChart(this.dataLoader.getUniqueItems());
    this.chartManager.createHeistBaseChart(this.dataLoader.getHeistBaseItems());
    this.chartManager.createClassChart(this.dataLoader.getAllClassNames());
    this.chartManager.createRareModsChart(this.dataLoader.getRareItemMods());
    this.chartManager.createTrinketModsChart(this.dataLoader.getTrinketMods());
    this.chartManager.createEnchantedModsChart(
      this.dataLoader.getEnchantedMods(),
    );
  }

  updateStatus(status) {
    const serverStatus = document.getElementById("serverStatus");
    if (serverStatus) {
      serverStatus.textContent = `Server ${status === "online" ? "Online" : "Offline"}`;
      serverStatus.className = `status ${status}`;
    }
  }

  updateFileStatus(stats) {
    const fileStatus = document.getElementById("fileStatus");
    const filePath = document.getElementById("filePath");

    if (fileStatus) {
      if (stats && stats.totalWings !== undefined) {
        fileStatus.textContent = `Wings: ${stats.totalWings} | Items: ${stats.totalItems}`;
        fileStatus.className = "status online";
      } else {
        fileStatus.textContent = "No Data";
        fileStatus.className = "status offline";
      }
    }
    if (filePath && this.currentLeague) {
      filePath.textContent = `${this.currentLeague}/**/*.json`;
    }
  }

  cleanup() {
    this.fileWatcher.disconnect();
    this.chartManager.destroyAll();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new HeistAnalyzer();
});

window.addEventListener("beforeunload", () => {
  if (window.app) {
    window.app.cleanup();
  }
});
