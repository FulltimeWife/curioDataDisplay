export class JSONProcessor {
  constructor(jsonData) {
    this.jsonData = jsonData;
    this.data = [];
  }

  parse() {
    this.data = [];

    const wings = Array.isArray(this.jsonData)
      ? this.jsonData
      : [this.jsonData];

    wings.forEach((wing) => {
      if (!wing.rewards || !wing.rewards.rewardData) {
        console.warn("Invalid wing structure: ", wing);
        return;
      }

      wing.rewards.rewardData.forEach((item) => {
        const parsedItem = this.parseItem(item, wing);
        this.data.push(parsedItem);
      });
    });

    return this.data();
  }

  parseItem(item, wing) {
    const parsedItem = {
      WingId: wing.id,
      League: wing.leagueName,
      ZoneName: wing.zoneName,
      AreaLevel: wing.areaLevel,
      Partial: wing.partial || false,

      ItemId: item.id,
      Timestamp: item.timestamp,
      BaseName: item.baseName || "",
      DisplayName: item.displayName || "",
      ClassName: item.className || "",
      Rarity: item.rarity || "",
      StackSize: item.stackSize || "",
    };

    if (item.mods) {
      this.parseMods(parsedItem, item.mods);
    }

    return parsedItem;
  }

  parseMods(parsedItem, mods) {
    if (mods.explicitMods && Array.isArray(mods.explicitMods)) {
      mods.explicitMods.forEach((mod, index) => {
        const modNum = index + 1;
        parsedItem[`Explicit${modNum}_Display`] = mod.display || "";
        parsedItem[`Explicit${modNum}_Translation`] = mod.translation || "";
        parsedItem[`Explicit${modNum}_Values`] = mod.value || "";
        parsedItem[`Explicit${modNum}_Raw`] = mod.raw || "";
      });

      parsedItem.ModTranslations = mods.explicitMods
        .map((mod) => mod.translation)
        .filter((t) => t)
        .join(" | ");
    }

    if (mods.enchantedMods && Array.isArray(mods.enchantedMods)) {
      mods.enchantedMods.forEach((mod, index) => {
        const modNum = index + 1;
        parsedItem[`Enchanted${modNum}_Display`] = mod.display || "";
        parsedItem[`Enchanted${modNum}_Translation`] = mod.translation || "";
        parsedItem[`Enchanted${modNum}_Values`] = mod.value || "";
        parsedItem[`Enchanted${modNum}_Raw`] = mod.raw || "";
      });
    }
  }

  getData() {
    return this.data;
  }

  getWings() {
    const wingsMap = new Map();

    this.data.forEach((item) => {
      if (!wingsMap.has(item.WingId)) {
        wingsMap.set(item.WingId, {
          id: item.WingId,
          league: item.League,
          zoneName: item.ZoneName,
          areaLevel: item.AreaLevel,
          partial: item.Partial,
          itemCount: 0,
        });
      }
      wingsMap.get(item.WingId).itemCount++;
    });

    return Array.from(wingsMap.values());
  }
}
