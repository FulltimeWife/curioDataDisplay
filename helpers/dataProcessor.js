export class DataProcessor {
  getReplicaItems(data) {
    return data.filter(
      (item) => item.DisplayName && item.DisplayName.includes("Replica")
    );
  }

  getUniqueItems(data) {
    return data.filter(
      (item) =>
        item.DisplayName &&
        item.Rarity === "Unique" &&
        !item.DisplayName.includes("Replica")
    );
  }

  getRareItems(data) {
    return data.filter(
      (item) =>
        item.Rarity === "Rare" &&
        item.BaseName &&
        !item.BaseName?.includes("Thief's Trinket")
    );
  }

  getThiefTrinkets(data) {
    return data.filter(
      (item) => item.BaseName && item.BaseName?.includes("Thief's Trinket")
    );
  }

  getHeistBaseItems(data) {
    return data.filter(
      (item) =>
        item.Rarity === "Rare" &&
        item.BaseName &&
        !item.Enchanted1_Display &&
        !item.BaseName?.includes("Thief's Trinket")
    );
  }

  getAllClassNames(data) {
    return data.map((item) => {
      const className = item.ClassName;
      return className && className.trim() !== "" ? className : "Unknown";
    });
  }

  getActualClassNames(data) {
    return data
      .map((item) => item.ClassName)
      .filter((className) => className && className.trim() !== "");
  }

  getRareItemMods(data) {
    const rareItems = this.getRareItems(data);
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
      const allModsValue = item["AllModTranslations"] || "";
      if (allModsValue.trim() !== "") {
        const splitMods = allModsValue.split("|").map((mod) => mod.trim());
        splitMods.forEach((mod) => {
          if (mod) mods.push(mod);
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
    const classNames = this.getActualClassNames(data);
    const rareMods = this.getRareItemMods(data);
    const trinketMods = this.getTrinketMods(data);
    const enchantedMods = this.getEnchantedMods(data);

    const classCounts = {};
    classNames.forEach((className) => {
      classCounts[className] = (classCounts[className] || 0) + 1;
    });

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
        .map(([name, count]) => ({ name, count })),
    };
  }
}
