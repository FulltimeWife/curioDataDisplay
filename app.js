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

    this.isLoading = false;
    this.hasData = false;

    this.initialize();
  }

  async initialize() {
    this.showLoadingOverlay("Connecting to server");
    this.updateStatus("offline");
    this.setupEventHandlers();
    this.createFilterControls();

    await this.checkServerHealth();

    this.fileWatcher.connect();
    this.setupFileWatcherCallbacks();
  }

  showLoadingOverlay(message = "Loading") {
    this.isLoading = true;
    let overlay = document.getElementById("loadingOverlay");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "loadingOverlay";
      overlay.className = "loading-overlay";
      overlay.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">${message}</div>
      `;
      document.body.appendChild(overlay);
    } else {
      overlay.querySelector(".loading-text").textContent = message;
      overlay.classList.remove("hidden");
    }
  }

  hideLoadingOverlay() {
    this.isLoading = false;
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
      overlay.classList.add("hidden");
      setTimeout(() => overlay.remove(), 300);
    }
  }

  showEmptyState(container, message) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
      <div class="empty-state-title">No Data Available</div>
      <div class="empty-state-text">${message}<div>
      <div class="empty-state-subtext>Try adjusting your filters to see more data (or wait for data to be collected with your filters)</div>
    `;
    container.innerHTML = "";
    container.appendChild(emptyState);
  }

  createFilterControls() {
    const header = document.querySelector("header");
    if (!header) return;

    const filterSection = document.createElement("div");
    filterSection.className = "filter-section";
    filterSection.innerHTML = `
      <div class="filter-container">
        <div class="filter-group">
          <label class="filter-label" for="leagueFilter"> League </label>
          <select id="leagueFilter" class="filter-select">
            <option value="All"> All Leagues</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label" for="characterFilter"> Character </label>
          <select id="characterFilter" class="filter-select">
            <option value="All"> All Characters</option>
          </select>
        </div>
      </div>

      <div class="filter-actions">
        <button class="filter-clear-btn" id="clearFiltersBtn" disabled> Clear Filters </button>
        <button class="filter-exports-btn> id="exportDataBtn"> Export Data </button>
      </div>
    `;

    header.parentNode.insertBefore(filterSection, header.nextSibling);

    this.setupFilterEventListeners();
  }

  setupFilterEventListeners() {
    const leagueSelect = document.getElementById("leagueFilter");
    const characterSelect = document.getElementById("characterFilter");
    const clearBtn = document.getElementById("clearFiltersBtn");
    const exportBtn = document.getElementById("exportDataBtn");

    if (leagueSelect) {
      leagueSelect.addEventListener("change", (e) => {
        this.handleFilterChange("league", e.target.value);
      });
    }

    if (characterSelect) {
      characterSelect.addEventListener("change", (e) => {
        this.handleFilterChange("character", e.target.value);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this.clearAllFilters();
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        this.exportData();
      });
    }
  }

  handleFilterChange(filterType, value) {
    if (filterType === "league") {
      this.dataLoader.setLeagueFilter(value);
    } else if (filterType === "character") {
      this.dataLoader.setCharacterFilter(value);
    }

    this.updateFilterActiveStates();
    this.updateDisplay();
    this.updateClearButtonState();
  }

  updateFilterActiveStates() {
    const leagueSelect = document.getElementById("leagueFilter");
    const characterSelect = document.getElementById("characterFilter");

    if (leagueSelect) {
      if (leagueSelect.value !== "All") {
        leagueSelect.classList.add("active");
      } else {
        leagueSelect.classList.remove("active");
      }
    }

    if (characterSelect) {
      if (characterSelect.value !== "All") {
        characterSelect.classList.add("active");
      } else {
        characterSelect.classList.remove("active");
      }
    }
  }

  updateClearButtonState() {
    const clearBtn = document.getElementById("clearFiltersBtn");
    const leagueSelect = document.getElementById("leagueFilter");
    const characterSelect = document.getElementById("characterFilter");

    if (clearBtn) {
      const hasActiveFilters =
        (leagueSelect && leagueSelect.value !== "All") ||
        (characterSelect && characterSelect.value !== "All");
      clearBtn.disabled = !hasActiveFilters;
    }
  }

  clearAllFilters() {
    const leagueSelect = document.getElementById("leagueFilter");
    const characterSelect = document.getElementById("characterFilter");

    if (leagueSelect) {
      leagueSelect.value = "All";
      leagueSelect.classList.remove("active");
    }

    if (characterSelect) {
      characterSelect.value = "All";
      characterSelect.classList.remove("active");
    }

    this.dataLoader.setLeagueFilter("All");
    this.dataLoader.setCharacterFilter("All");

    this.updateDisplay();
    this.updateClearButtonState();

    this.error.showError("Filters cleared", "success");
  }

  exportData() {
    try {
      const stats = this.dataLoader.getStats();
      const filteredData = this.dataLoader.getFilteredData();

      if (filteredData.length === 0) {
        this.errorHandler.showError("No data to export", "warning");
        return;
      }

      let csv = "Display Name,Base Name,Class,Rarity,League,Zone,Level\n";

      filteredData.forEach((item) => {
        const row = [
          this.escapeCsv(item.DisplayName),
          this.escapeCsv(item.BaseName),
          this.escapeCsv(item.Rarity),
          this.escapeCsv(item.LeagueName),
          this.escapeCsv(item.ZoneName),
          item.AreaLevel || "",
        ];
        csv += row.join(",") + "\n";
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const leagueFilter = this.dataLoader.currentFilters.leagueName;
      const charFilter = this.dataLoader.currentFilters.characterName;
      const timestamp = new Date().toISOString().split("T")[0];
      let filename = `heist-data-${timestamp}`;

      if (leagueFilter !== "All") {
        filename += `-${leagueFilter.replace(/\s+/g, "-")}`;
      }
      if (charFilter !== "All") {
        filename += `-${charFilter.replace(/\s+/g, "-")}`;
      }
      filename += ".csv";

      link.download = filename;
      document.body.append(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.errorHandler.showError(
        `Exported ${filteredData.length} items to ${filename}`,
        "success",
      );
    } catch (error) {
      console.error("Error exporting data: ", error);
      this.errorHandler.showError("Failed to export data", "error");
    }
  }

  escapeCsv(value) {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') | str.includes("\n")) {
      return `${str.replace(/"/g, '""')}`;
    }
    return str;
  }

  updateFilterOptions() {
    const leagueSelect = document.getElementById("leagueFilter");
    if (leagueSelect) {
      const currentValue = leagueSelect.value;
      const leagues = this.dataLoader.getAvailableLeagues();

      leagueSelect.innerHTML = '<option value="All">All Leagues</option>';
      leagues.forEach((league) => {
        const option = document.createElement("option");
        option.value = league;
        option.textContent = league;
        if (league === currentValue) option.selected = true;
        leagueSelect.appendChild(option);
      });
    }

    const characterSelect = document.getElementById("characterFilter");
    if (characterSelect) {
      const currentValue = characterSelect.value;
      const characters = this.dataLoader.getAvailableCharacters();

      characterSelect.innerHTML = '<option value="All">All Characters</option>';

      if (characters.length > 0) {
        characters.forEach((character) => {
          const option = document.createElement("option");
          option.value = character;
          option.textContent = character;
          if (character === currentValue) option.selected = true;
          characterSelect.appendChild(option);
        });
      }
    }

    this.updateFilterActiveStates();
    this.updateClearButtonState();
  }

  updateDisplay() {
    const stats = this.dataLoader.getStats();

    if (stats.totalItems === 0) {
      this.hasData = false;
      this.showEmptyStateForDashboard();
      return;
    }

    this.hasData = true;
    this.statsDisplay.update(stats);
    this.createCharts();

    const timeStr = new Date().toLocaleTimeString();
    const updateTimeEl = document.getElementById("updateTime");
    if (updateTimeEl) updateTimeEl.textContent = `Last Update: ${timeStr}`;

    console.log(
      `Display updated at ${timeStr} - ${stats.totalItems} items shown`,
    );
  }

  showEmptyStateForDashboard() {
    const statsDisplay = document.getElementById("statsDisplay");
    if (statsDisplay) {
      this.showEmptyState(
        statsDisplay,
        "No heist data found, make sure your exports contains files and server is running",
      );
    }

    this.chartManager.destroyAll();
  }

  setupEventHandlers() {
    const checkHealthBtn = document.createElement("button");
    checkHealthBtn.textContent = "Check Server Health";
    checkHealthBtn.style.cssText = `
      margin: 10px;
      padding: 8px 16px;
      background: rgba(75,175,80,0.9);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    `;
    checkHealthBtn.onclick = () => this.checkServerHealth();

    const statusBar = document.querySelector(".status-bar");
    if (statusBar) statusBar.appendChild(checkHealthBtn);
  }

  async checkServerHealth() {
    try {
      const health = await this.fileWatcher.checkHealth();
      if (health.status === "ok") {
        this.updateStatus("online");
        this.errorHandler.showError(
          `Connected to server, watching ${health.fileCount} files in ${health.directory}`,
          "success",
        );
      } else {
        this.updateStatus("offline");
        this.errorHandler.showError("Server is not responding", "error");
      }
    } catch (error) {
      this.updateStatus("offline");
      this.errorHandler.showError("Cannot connect to server", "error");
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
      this.hideLoadingOverlay();
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
        this.hideLoadingOverlay();
        return;
      }

      this.updateFileStatus(data.stats);

      if (Array.isArray(data.data)) {
        this.dataLoader.loadMultipleJSON(data.data);
      } else {
        this.dataLoader.loadJSON(data.data);
      }

      this.updateFilterOptions();
      this.updateDisplay();
      this.hideLoadingOverlay();

      if (data.type === "init") {
        const stats = this.dataLoader.getStats();
        this.errorHandler.showError(
          `Loaded ${stats.totalItems} items from ${data.stats.fileCount} files`,
          "success",
        );
      }
    } catch (error) {
      console.error("Error processing file update: ", error);
      this.errorHandler.showError(
        "Error processing data: " + error.message,
        "error",
      );
      this.hideLoadingOverlay();
    }
  }

  createCharts() {
    this.chartManager.destroyAll();

    const replicaItems = this.dataLoader.getReplicaItems();
    const uniqueItems = this.dataLoader.getUniqueItems();
    const heistBaseItems = this.dataLoader.getHeistBaseItems();
    const classNames = this.dataLoader.getAllClassNames();
    const rareItemMods = this.dataLoader.getRareItemMods();
    const trinketMods = this.dataLoader.getTrinketMods();
    const enchantedMods = this.dataLoader.getEnchantedMods();

    if (replicaItems.length > 0)
      this.chartManager.createReplicaChart(replicaItems);
    if (uniqueItems.length > 0)
      this.chartManager.createUniqueChart(uniqueItems);
    if (heistBaseItems.length > 0)
      this.chartManager.createHeistBaseChart(heistBaseItems);
    if (classNames.length > 0) this.chartManager.createClassChart(classNames);
    if (rareItemMods.length > 0)
      this.chartManager.createRareModsChart(rareItemMods);
    if (trinketMods.length > 0)
      this.chartManager.createTrinketModsChart(trinketMods);
    if (enchantedMods.length > 0)
      this.chartManager.createEnchantedModsChart(enchantedMods);
  }

  updateStatus(status) {
    const serverStatus = document.getElementById("serverStatus");
    if (serverStatus) {
      serverStatus.textContent = `Server: ${
        status === "online" ? "Online" : "Offline"
      }`;
      serverStatus.className = `status ${status}`;
    }
  }

  updateFileStatus(stats) {
    const fileStatus = document.getElementById("fileStatus");
    const filePath = document.getElementById("filePath");

    if (fileStatus) {
      if (stats && stats.exists) {
        const sizeKB = Math.round(stats.totalSize / 1024);
        const timeStr = stats.lastModified
          ? new Date(stats.lastModified).toLocaleTimeString()
          : "N/A";
        fileStatus.textContent = `Files: ${stats.fileCount} (${sizeKB}KB, ${timeStr})`;
        fileStatus.className = "status online";
      } else {
        fileStatus.textContent = "Files: Not Found";
        fileStatus.className = "status offline";
      }
    }

    if (filePath) {
      filePath.textContent =
        "D:/AntiBeltMeasure/CoreJ/Plugins/Temp/CurioDataScience/exports/**/*.json";
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
