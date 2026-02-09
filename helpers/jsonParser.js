export class JSONProcessor {
  constructor() {
    this.data = [];
    this.metadata = {
      leagueName: null,
      zoneName: null,
      partial: false,
      areaLevel: null,
    };
  }

  parseSingle(jsonText) {
    try {
      const json = JSON.parse(jsonText);
      return this.extractRewards(json);
    } catch (error) {
      console.error("Error parsing JSON: ", error);
      return [];
    }
  }

  parseMultiple(jsonFiles) {
    this.data = [];
    jsonFiles.forEach((jsonText) => {
      const items = this.parseSingle(jsonText);
      this.data.push(...items);
    });

    return this.data;
  }

  extractRewards(jsonData) {
    const items = [];
    if (!jsonData.rewards || !jsonData.rewards.rewardData) {
      console.warn(`No reward data found in JSON: ${jsonData}`);
      return items;
    }

    const metadata = {
      leagueName: jsonData.leagueName || "Unknown",
      zoneName: jsonData.zoneName || "Unknown",
      partial: jsonData.partial || false,
      areaLevel: jsonData.areaLevel || 83,
      heistId: jsonData.id || null,
    };

    jsonData.rewards.rewardData.forEach((reward) => {
      items.push(this.transformReward(reward, metadata));
    });
    return items;
  }

  transformReward(reward, metadata) {
    const item = {
      DisplayName: reward.displayName || "",
      BaseName: reward.baseName || "",
      ClassName: reward.className || "",
      Rarity: reward.rarity || "",
      LeagueName: metadata.leagueName,
      ZoneName: metadata.zoneName,
      Partial: metadata.partial,
      AreaLevel: metadata.areaLevel,
      HeistId: metadata.heistId,
      Timestamp: reward.timestamp || "",
      ItemId: reward.id || "",
      StackSize: reward.stackSize || 0,
      ...this.processMods(reward.mods || {}),
    };
    return item;
  }

  processMods(mods) {
    const result = {};

    if (mods.explicitMods && Array.isArray(mods.explicitMods)) {
      mods.explicitMods.forEach((mod, index) => {
        if (index < 6) {
          const num = index + 1;
          result[`Explicit${num}_Display`] = mod.display || "";
          result[`Explicit${num}_Translation`] = mod.translation || "";
          result[`Explicit${num}_Value`] = mod.value || "";
          result[`Explicit${num}_Raw`] = mod.raw || "";
        }
      });
    }

    if (mods.enchantedMods && Array.isArray(mods.enchantedMods)) {
      mods.enchantedMods.forEach((mod, index) => {
        if (index < 1) {
          result[`Enchanted1_Display`] = mod.display || "";
          result[`Enchanted1_Translation`] = mod.translation || "";
          result[`Enchanted1_Value`] = mod.value || "";
          result[`Enchanted1_Raw`] = mod.raw || "";
        }
      });
    }

    if (mods.explicitMods && Array.isArray(mods.explicitMods)) {
      const translations = mods.explicitMods
        .map((mod) => mod.translation || "")
        .filter((t) => t.trim() !== "");
      result["ModTranslations"] = translations.join("|");
    }
    return result;
  }

  getData() {
    return this.data;
  }
}
