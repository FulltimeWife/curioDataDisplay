export class DataProcessor {
  constructor() {
    this.rawData = [];
    this.normalizedData = [];
    this.leagues = new Set();
    this.zones = new Set();
  }

  loadData(data, format = "csv") {
    this.rawData = data;

    if (format === "json") {
      this.normalizedData = this.normalizeJSON(data);
    } else {
      this.normalizedData = this.normalizeCSV(data);
    }

    this.extractFilters();
    return this.normalizedData;
  }

  normalizeJSON(jsonData) {
    const normalized = [];

    const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];

    dataArray.forEach((file) => {
      const leagueName = file.leagueName || "Unknown";
      const zoneName = file.zoneName || "Unknown";
      const areaLevel = file.areaLevel || 0;

      if (file.rewards && file.rewards.rewardData) {
        file.rewards.rewardData.forEach((item) => {
          normalized.push({
            Timestamp: item.timestamp,
            League: leagueName,
            Zone: zoneName,
            AreaLevel: areaLevel,
            DisplayName: item.DisplayName || "",
            BaseName: item.BaseName || "",
            ClassName: item.ClassName || "",
            Rarity: item.rarity || "",
            StackSize: item.stackSize || "",
            ...this.extractModsFromJSON(item.mods),
            AllModTranslations: this.getAllModTranslations(item.mods),
          });
        });
      }
    });
    return normalized;
  }

  extractModsFromJSON(mods) {
    const extracted = {};

    if (mods && mods.explicitMods) {
      mods.explicitMods.forEach((mod, index) => {
        const num = index + 1;
        extracted[`Explicit${num}_Display`] = mod.display || "";
        extracted[`Explicit${num}_Translation`] = mod.translation || "";
        extracted[`Explicit${num}_Values`] = mod.value || "";
      });
    }

    if (mods && mods.enchantedMods && mods.enchantedMods.length > 0) {
      const enchant = mods.enchantedMods[0];
      extracted["Enchanted1_Display"] = enchant.display || "";
      extracted["Enchanted1_Translation"] = enchant.translation || "";
    }
    return extracted;
  }

  getAllModTranslations(mods) {
    const translations = [];
    if (mods && mods.explicitMods) {
      mods.explicitMods.forEach((mod) => {
        if (mod.raw) translations.push(mod.raw);
      });
    }
    return translations.join(" | ");
  }

  normalizeCSV(csvData) {
    return csvData.map((item) => ({
      ...item,
      League: item.League || "Unknown",
      Zone: item.Zone || "Unknown",
      AreaLevel: item.AreaLevel || 0,
    }));
  }

  extractFilters() {
    this.leagues.clear();
    this.zones.clear();

    this.normalizedData.forEach((item) => {
      if (item.League) this.leagues.add(item.League);
      if (item.Zone) this.zones.add(item.Zone);
    });
  }

  getFilteredData(league = "all", zone = "all") {
    return this.normalizedData.filter((item) => {
      const leagueMatch = league === "all" || item.league === league;
      const zoneMatch = zone === "all" || item.Zone === zone;
      return leagueMatch && zoneMatch;
    });
  }

  getLeagues() {
    return ["all", ...Array.from(this.leagues).sort()];
  }

  getZones() {
    return ["all", ...Array.from(this.zones).sort()];
  }

  getReplicaItems(data) {
    return data.filter(
      (item) => item.DisplayName && item.DisplayName.includes("Replica"),
    );
  }

  getUniqueItems(data) {
    return data.filter(
      (item) =>
        item.DisplayName &&
        item.Rarity === "Unique" &&
        !item.DisplayName.includes("Replica"),
    );
  }

  getRareItems(data) {
    return data.filter(
      (item) =>
        item.Rarity === "Rare" &&
        item.BaseName &&
        !item.BaseName?.includes("Thief's Trinket"),
    );
  }

  getThiefsTrinkets(data) {
    return data.filter(
      (item) => item.BaseName && item.BaseName?.includes("Thief's Trinket"),
    );
  }

  getHeistBaseItems(data) {
    return data.filter(
      (item) =>
        item.Rarity === "Rare" &&
        item.BaseName &&
        !item.Enchanted1_Display &&
        !item.BaseName?.includes("Thief's Trinket"),
    );
  }

  getClassNames(data) {
    return data
      .map((item) => item.ClassName)
      .filter((className) => className && className.trim() !== "");
  }

  extractMods(data, modType) {
    const mods = [];

    data.forEach((item) => {
      if (modType === "rare") {
        for (let i = 1; i <= 6; i++) {
          const mod = item[`Explicit${i}_Display`];
          if (mod && mod.trim() !== "") {
            mods.push(mod.replace(/\n/g, " ").trim());
          }
        }
      } else if (modType === "trinket") {
        const allMods = item["AllModTranslations"] || "";
        if (allMods.trim() !== "") {
          allMods.split("|").forEach((mod) => {
            const trimmed = mod.trim();
            if (trimmed) mods.push(trimmed);
          });
        }
      } else if (modType === "enchanted") {
        const enchant = item["Enchanted1_Display"];
        if (enchant && enchant.trim() !== "") {
          mods.push(enchant.replace(/\n/g, " ").trim());
        }
      }
    });
    return mods;
  }

  getStats(data) {
    const replicaItems = this.getReplicaItems(data);
    const uniqueItems = this.getUniqueItems(data);
    const rareItems = this.getRareItems(data);
    const heistBases = this.getHeistBaseItems(data);
    const trinkets = this.getThiefsTrinkets(data);
    const classNames = this.getClassNames(data);
    const rareMods = this.extractMods(rareItems, "rare");
    const trinketMods = this.extractMods(trinkets, "trinket");
    const enchantedMods = this.extractMods(data, "enchanted");

    const classCounts = this.countOccurrences(classNames);

    return {
      totalItems: data.length,
      replicaItems: replicaItems.length,
      uniqueItems: uniqueItems.length,
      rareItems: rareItems.length,
      heistBases: heistBases.length,
      trinkets: trinkets.length,
      uniqueClasses: Object.keys(classCounts).length,
      rareMods: rareMods.length,
      trinketMods: trinketMods.length,
      enchantedMods: enchantedMods.length,
      topClasses: Object.entries(classCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => {
          {
            (name, count);
          }
        }),
    };
  }

  countOccurrences(array) {
    return array.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});
  }
}
