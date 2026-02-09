import { DataProcessor } from "../helpers/dataProcessor.js";
import { JSONProcessor } from "../helpers/jsonParser.js";

export class DataLoader {
  constructor() {
    this.data = [];
    this.processor = new DataProcessor();
    this.jsonProcessor = new JSONProcessor();
    this.currentFilters = {
      leagueName: "All",
      characterName: "All",
    };
  }
  loadJSON(jsonData) {
    const items = this.jsonProcessor.parseSingle(jsonData);
    this.data = items;
    return this.data;
  }

  loadMultipleJSON(jsonFiles) {
    this.data = this.jsonProcessor.parseMultiple(jsonFiles);
    return this.data;
  }

  setLeagueFilter(leagueName) {
    this.currentFilters.leagueName = leagueName;
  }

  setCharacterFilter(characterName) {
    this.currentFilters.characterName = characterName;
  }

  getFilteredData() {
    let filtered = this.data;

    if (
      this.currentFilters.leagueName &&
      this.currentFilters.leagueName !== "All"
    ) {
      filtered = this.processor.filterByLeague(
        filtered,
        this.currentFilters.leagueName,
      );
    }

    if (
      this.currentFilters.characterName &&
      this.currentFilters.characterName !== "All"
    ) {
      filtered = this.processor.filterByCharacter(
        filtered,
        this.currentFilters.characterName,
      );
    }

    return filtered;
  }

  getAvailableLeagues() {
    return this.processor.getUniqueLeagues(this.data);
  }

  getAvailableCharacters() {
    return this.processor.getUniqueCharacters(this.data);
  }

  getReplicaItems() {
    const filtered = this.getFilteredData();
    return this.processor.getReplicaItems(filtered);
  }

  getUniqueItems() {
    const filtered = this.getFilteredData();
    return this.processor.getUniqueItems(filtered);
  }

  getHeistBaseItems() {
    const filtered = this.getFilteredData();
    return this.processor.getHeistBaseItems(filtered);
  }

  getRareItems() {
    const filtered = this.getFilteredData();
    return this.processor.getRareItems(filtered);
  }

  getThiefTrinkets() {
    const filtered = this.getFilteredData();
    return this.processor.getThiefsTrinkets(filtered);
  }

  getAllClassNames() {
    const filtered = this.getFilteredData();
    return this.processor.getAllClassNames(filtered);
  }

  getRareItemMods() {
    const filtered = this.getFilteredData();
    return this.processor.getRareItemMods(filtered);
  }

  getTrinketMods() {
    const filtered = this.getFilteredData();
    return this.processor.getTrinketMods(filtered);
  }

  getEnchantedMods() {
    const filtered = this.getFilteredData();
    return this.processor.getEnchantedMods(filtered);
  }

  getStats() {
    const filtered = this.getFilteredData();
    return this.processor.getStats(filtered);
  }
}
