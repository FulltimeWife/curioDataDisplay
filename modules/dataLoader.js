import { CSVProcessor } from "../helpers/csvParser.js";
import { DataProcessor } from "../helpers/dataProcessor.js";
import { JSONProcessor } from "../helpers/jsonParser.js";

export class DataLoader {
  constructor() {
    this.data = [];
    this.processor = new DataProcessor();
    this.dataFormat = null;
    this.wings = [];
  }

  loadCSV(csvText) {
    const parser = new CSVProcessor(csvText);
    this.data = parser.parse();
    this.dataFormat = "csv";
    return this.data;
  }

  loadJSON(jsonData) {
    const parser = new JSONProcessor(jsonData);
    this.data = parser.parse();
    this.wings = parser.getWings();
    this.dataFormat = "json";
    return this.data;
  }

  loadData(data) {
    if (typeof data === "string") {
      return this.loadCSV(data);
    } else if (typeof data === "object") {
      return this.loadJSON(data);
    } else {
      throw new Error("Unknown data format");
    }
  }

  getDataFormat() {
    return this.dataFormat;
  }

  getWings() {
    return this.wings;
  }

  getWingStats() {
    if (this.dataFormat !== "json") {
      return null;
    }

    const stats = {
      totalWings: this.wings.length,
      wingsByZone: {},
      wingsByLeague: {},
      totalItems: this.data.length,
    };

    this.wings.forEach((wing) => {
      if (!stats.wingsByZone[wing.zoneName]) {
        stats.wingsByZone[wing.zoneName] = 0;
      }
      stats.wingsByZone[wing.zoneName]++;

      if (!stats.wingsByLeague[wing.league]) {
        stats.wingsByLeague[wing.league] = 0;
      }
      stats.wingsByLeague[wing.league]++;
    });

    return stats;
  }

  getReplicaItems() {
    return this.processor.getReplicaItems(this.data);
  }

  getUniqueItems() {
    return this.processor.getUniqueItems(this.data);
  }

  getHeistBaseItems() {
    return this.processor.getHeistBaseItems(this.data);
  }

  getRareItems() {
    return this.processor.getRareItems(this.data);
  }

  getThiefTrinkets() {
    return this.processor.getThiefsTrinkets(this.data);
  }

  getAllClassNames() {
    return this.processor.getAllClassNames(this.data);
  }

  getRareItemMods() {
    return this.processor.getRareItemMods(this.data);
  }

  getTrinketMods() {
    return this.processor.getTrinketMods(this.data);
  }

  getEnchantedMods() {
    return this.processor.getEnchantedMods(this.data);
  }

  getStats() {
    const baseStats = this.processor.getStats(this.data);

    if (this.dataFormat === "json") {
      const wingStats = this.getWingStats();
      return {
        ...baseStats,
        wingStats,
      };
    }
    return baseStats;
  }
}
