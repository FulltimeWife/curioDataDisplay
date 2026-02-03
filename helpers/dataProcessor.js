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

  getAllClassNames(data) {
    return data.map((item) => {
      const className = item.ClassName;
      return className && className.trim() !== "" ? className : "Unknown";
    });
  }

  extractMods(data, modType) {
    const mods = [];

    rareItems.forEach((item) => {
      for (let i = 1; i <= 6; i++) {
        const mod = item[`Explicit${i}_Display`];
        if (mod && mod.trim() !== "") {
          mods.push(mod.replace(/\n/g, " ").trim());
        }
      }
    });

    return mods;
  }

  getTrinketMods(data) {
    const trinkets = this.getThiefTrinkets(data);
    const mods = [];

    trinkets.forEach((item) => {
      const allModsValue = item["ModTranslations"] || "";
      if (allModsValue.trim() !== "") {
        const splitMods = allModsValue
          .split("|")
          .map((mod) => mod.replace(/\d[%]|\d\d[%]/g, "").trim());
        splitMods.forEach((mod) => {
          switch (mod) {
            case "chance to receive additional Weapons when opening a Reward Chest in a Heist":
              mods.push("Additional Weapon");
              break;
            case "Smuggler's Caches have  chance to Duplicate contained Rogue's Markers":
              mods.push("Smuggler's Dupe Markers");
              break;
            case "chance in Heists for Orbs of Augmentation to drop as Chaos Orbs instead":
              mods.push("Aug -> Chaos");
              break;
            case "chance to receive additional Delve items when opening a Reward Chest in a Heist":
              mods.push("Addiitonal Delve");
              break;
            case "chance to receive additional Armour items when opening a Reward Chest in a Heist":
              mods.push("Additional Armour");
              break;
            case "chance to receive additional Gold when opening a Reward Chest in a Heist":
              mods.push("Additonal Gold");
              break;
            case "chance in Heists for Chromatic Orbs to drop as Jeweller's Orbs instead":
              mods.push("Chromatic -> Jeweller");
              break;
            case "chance to receive additional Legion items when opening a Reward Chest in a Heist":
              mods.push("Additional Legion");
              break;
            case "chance to receive additional Talismans when opening a Reward Chest in a Heist":
              mods.push("Additional Talisman");
              break;
            case "chance in Heists for Items to drop fully linked":
              mods.push("Fully Linked");
              break;
            case "chance to receive additional Divination Card items when opening a Reward Chest in a Heist":
              mods.push("Additional Divination Card");
              break;
            case "chance to receive additional Ultimatum items when opening a Reward Chest in a Heist":
              mods.push("Additional Ultimatum");
              break;
            case "chance in Heists for Orbs of Alteration to drop as Orbs of Alchemy instead":
              mods.push("Alteration -> Alchemy");
              break;
            case "chance in Heists for Items to drop with an additional Socket":
              mods.push("Additional Socket");
              break;
            case "chance to receive additional Harbinger items when opening a Reward Chest in a Heist":
              mods.push("Additional Harbinger");
              break;
            case "Monsters have  chance to Duplicate dropped Rogue's Marker":
              mods.push("Monster Dupe Markers");
              break;
            case "chance to receive additional Blight items when opening a Reward Chest in a Heist":
              mods.push("Additional Blight");
              break;
            case "chance to receive additional Jewellery when opening a Reward Chest in a Heist":
              mods.push("Additional Jewellery");
              break;
            case "chance in Heists for Basic Currency drops to be Duplicated":
              mods.push("Basic Currency Drop Dupe");
              break;
            case "increased Quantity of Items dropped in Heists":
              mods.push("Increasd Quantity");
              break;
            case "chance in Heists for Orbs of Scouring to drop as Orbs of Regret instead":
              mods.push("Scouring -> Regret");
              break;
            case "chance in Heists for Orbs of Augmentation to drop as Orbs of Alchemy instead":
              mods.push("Augmentation -> Alchemy");
              break;
            case "chance in Heists for Jeweller's Orbs to drop as Orbs of Fusing instead":
              mods.push("Jeweller -> Fusing");
              break;
            case "chance in Heists for Orbs of Transmutation to drop as Orbs of Alchemy instead":
              mods.push("Transmutation -> Alchemy");
              break;
            case "chance to receive additional Essences when opening a Reward Chest in a Heist":
              mods.push("Additional Essence");
              break;
            case "increased Rarity of Items dropped in Heists":
              mods.push("Increased Rarity");
              break;
            case "chance to receive additional Gem items when opening a Reward Chest in a Heist":
              mods.push("Additonal Gem");
              break;
            case "chance in Heists for Chromatic Orbs to drop as Orbs of Fusing instead":
              mods.push("Chromatic -> Fusing");
              break;
            case "chance in Heists for Items to drop Corrupted":
              mods.push("Corrupted Item");
              break;
            case "chance in Heists for Orbs of Scouring to drop as Orbs of Annulment instead":
              mods.push("Scouring -> Annulment");
              break;
            case "chance in Heists for Items to drop with Shaper Influence":
              mods.push("Shaper Influence");
              break;
            case "chance in Heists for Orbs of Transmutation to drop as Chaos Orbs instead":
              mods.push("Transmutation -> Chaos");
              break;
            case "chance in Heists for Orbs of Alteration to drop as Chaos Orbs instead":
              mods.push("Alteration -> Chaos");
              break;
            case "chance in Heists for Items to drop Identified":
              mods.push("Identified Items");
              break;
            case "chance to receive additional Abyss items when opening a Reward Chest in a Heist":
              mods.push("Additonal Abyss");
              break;
            case "chance to receive additional Unique items when opening a Reward Chest in a Heist":
              mods.push("Additional Unique");
              break;
            case "Heist Chests have a  chance to Duplicate contained Basic Currency":
              mods.push("Chest Currency Dupe");
              break;
            case "chance in Heists for Regal Orbs to drop as Divine Orbs instead":
              mods.push("Regal -> Divine");
              break;
            case "chance to receive additional Delirium items when opening a Reward Chest in a Heist":
              mods.push("Additonal Delirium");
              break;
            case "chance in Heists for Orbs of Alteration to drop as Regal Orbs instead":
              mods.push("Alteration -> Regal");
              break;
            case "chance in Heists for Regal Orbs to drop as Exalted Orbs instead":
              mods.push("Regal -> Exalt");
              break;
            case "chance in Heists for Orbs of Regret to drop as Orbs of Annulment instead":
              mods.push("Regret -> Annulment");
              break;
            case "chance in Heists for Orbs of Augmentation to drop as Regal Orbs instead":
              mods.push("Augmentation -> Regal");
              break;
            case "chance in Heists for Items to drop with Elder Influence":
              mods.push("Elder Influence");
              break;
            default:
              mods.push(mod);
          }
        });
      }
    });

    return mods;
  }

  getEnchantedMods(data) {
    const mods = [];

    data.forEach((item) => {
      const enchantedMod = item["Enchanted1_Display"];
      if (enchantedMod && enchantedMod.trim() !== "") {
        mods.push(enchantedMod.replace(/\n/g, " ").trim());
      }
    });
    return mods;
  }

  getStats(data) {
    const replicaItems = this.getReplicaItems(data);
    const uniqueItems = this.getUniqueItems(data);
    const rareItems = this.getRareItems(data);
    const heistBases = this.getHeistBaseItems(data);
    const trinkets = this.getThiefTrinkets(data);
    const classNames = this.getAllClassNames(data);
    const rareMods = this.getRareItemMods(data);
    const trinketMods = this.getTrinketMods(data);
    const enchantedMods = this.getEnchantedMods(data);

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
