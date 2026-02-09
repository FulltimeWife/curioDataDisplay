export class DataProcessor {
  getTrinketModTranslation(raw, translation) {
    if (!translation.includes("<unknown")) {
      return translation;
    }

    switch (raw) {
      case "HeistTrinketAdditionalBreachRewardsFromRewardChests1":
        return "chance to receive additional Breach items when opening a Reward Chest in a Heist";

      case "HeistTrinketAdditionalGoldRewardsFromRewardChests1":
        return "chance to receive additional Gold when opening a Reward Chest in a Heist";
      default:
        return translation;
    }
  }

  filterByLeague(data, leagueName) {
    if (!leagueName || leagueName === "All") return data;
    return data.filter((item) => item.LeagueName === leagueName);
  }

  filterByCharacter(data, characterName) {
    if (!characterName || characterName === "All") return data;
    return data.filter((item) => item.CharacterName === characterName);
  }

  getUniqueLeagues(data) {
    const leagues = new Set();
    data.forEach((item) => {
      if (item.LeagueName) leagues.add(item.LeagueName);
    });
    return Array.from(leagues).sort();
  }

  getUniqueCharacters(data) {
    const characters = new Set();
    data.forEach((item) => {
      if (item.CharacterName) characters.add(item.CharacterName);
    });
    return Array.from(characters).sort();
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

  getThiefTrinkets(data) {
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
      for (let i = 1; i <= 4; i++) {
        const translation = item[`Explicit${i}_Translation`];
        const raw = item[`Explicit${i}_Raw`];

        if (translation && translation.trim() !== "") {
          const readableTranslation = this.getTrinketModTranslation(
            raw,
            translation,
          );

          const categorized = this.categorizeTrinketMod(readableTranslation);
          mods.push(categorized);
        }
      }
    });
    return mods;
  }

  categorizeTrinketMod(mod) {
    const cleanMod = mod.replace(/\d+[%]/g, "").trim();

    switch (cleanMod) {
      case "chance to receive additional Weapons when opening a Reward Chest in a Heist":
        return "Additional Weapon";
      case "Smuggler's Caches have  chance to Duplicate contained Rogue's Markers":
        return "Smuggler's Dupe Markers";
      case "chance in Heists for Orbs of Augmentation to drop as Chaos Orbs instead":
        return "Aug -> Chaos";
      case "chance to receive additional Delve items when opening a Reward Chest in a Heist":
        return "Additional Delve";
      case "chance to receive additional Armour items when opening a Reward Chest in a Heist":
        return "Additional Armour";
      case "chance to receive additional Gold when opening a Reward Chest in a Heist":
        return "Additional Gold";
      case "chance in Heists for Chromatic Orbs to drop as Jeweller's Orbs instead":
        return "Chromatic -> Jeweller";
      case "chance to receive additional Legion items when opening a Reward Chest in a Heist":
        return "Additional Legion";
      case "chance to receive additional Talismans when opening a Reward Chest in a Heist":
        return "Additional Talisman";
      case "chance in Heists for Items to drop fully linked":
        return "Fully Linked";
      case "chance to receive additional Divination Card items when opening a Reward Chest in a Heist":
        return "Additional Divination Card";
      case "chance to receive additional Ultimatum items when opening a Reward Chest in a Heist":
        return "Additional Ultimatum";
      case "chance in Heists for Orbs of Alteration to drop as Orbs of Alchemy instead":
        return "Alteration -> Alchemy";
      case "chance in Heists for Items to drop with an additional Socket":
        return "Additional Socket";
      case "chance to receive additional Harbinger items when opening a Reward Chest in a Heist":
        return "Additional Harbinger";
      case "Monsters have  chance to Duplicate dropped Rogue's Marker":
        return "Monster Dupe Markers";
      case "chance to receive additional Blight items when opening a Reward Chest in a Heist":
        return "Additional Blight";
      case "chance to receive additional Jewellery when opening a Reward Chest in a Heist":
        return "Additional Jewellery";
      case "chance in Heists for Basic Currency drops to be Duplicated":
        return "Basic Currency Drop Dupe";
      case "increased Quantity of Items dropped in Heists":
        return "Increased Quantity";
      case "chance in Heists for Orbs of Scouring to drop as Orbs of Regret instead":
        return "Scouring -> Regret";
      case "chance in Heists for Orbs of Augmentation to drop as Orbs of Alchemy instead":
        return "Augmentation -> Alchemy";
      case "chance in Heists for Jeweller's Orbs to drop as Orbs of Fusing instead":
        return "Jeweller -> Fusing";
      case "chance in Heists for Orbs of Transmutation to drop as Orbs of Alchemy instead":
        return "Transmutation -> Alchemy";
      case "chance to receive additional Essences when opening a Reward Chest in a Heist":
        return "Additional Essence";
      case "increased Rarity of Items dropped in Heists":
        return "Increased Rarity";
      case "chance to receive additional Gem items when opening a Reward Chest in a Heist":
        return "Additional Gem";
      case "chance in Heists for Chromatic Orbs to drop as Orbs of Fusing instead":
        return "Chromatic -> Fusing";
      case "chance in Heists for Items to drop Corrupted":
        return "Corrupted Item";
      case "chance in Heists for Orbs of Scouring to drop as Orbs of Annulment instead":
        return "Scouring -> Annulment";
      case "chance in Heists for Items to drop with Shaper Influence":
        return "Shaper Influence";
      case "chance in Heists for Orbs of Transmutation to drop as Chaos Orbs instead":
        return "Transmutation -> Chaos";
      case "chance in Heists for Orbs of Alteration to drop as Chaos Orbs instead":
        return "Alteration -> Chaos";
      case "chance in Heists for Items to drop Identified":
        return "Identified Items";
      case "chance to receive additional Abyss items when opening a Reward Chest in a Heist":
        return "Additional Abyss";
      case "chance to receive additional Unique items when opening a Reward Chest in a Heist":
        return "Additional Unique";
      case "Heist Chests have a  chance to Duplicate contained Basic Currency":
        return "Chest Currency Dupe";
      case "chance in Heists for Regal Orbs to drop as Divine Orbs instead":
        return "Regal -> Divine";
      case "chance to receive additional Delirium items when opening a Reward Chest in a Heist":
        return "Additional Delirium";
      case "chance in Heists for Orbs of Alteration to drop as Regal Orbs instead":
        return "Alteration -> Regal";
      case "chance in Heists for Regal Orbs to drop as Exalted Orbs instead":
        return "Regal -> Exalt";
      case "chance in Heists for Orbs of Regret to drop as Orbs of Annulment instead":
        return "Regret -> Annulment";
      case "chance in Heists for Orbs of Augmentation to drop as Regal Orbs instead":
        return "Augmentation -> Regal";
      case "chance in Heists for Items to drop with Elder Influence":
        return "Elder Influence";
      case "chance to receive additional Breach items when opening a Reward Chest in a Heist":
        return "Additional Breach";
      default:
        return cleanMod;
    }
  }

  getEnchantedMods(data) {
    const mods = [];

    data.forEach((item) => {
      const enchantedMod = item["Enchanted1_Display"];
      if (enchantedMod && enchantedMod.trim() !== "")
        mods.push(enchantedMod.replace(/\n/g, " ").trim());
    });

    return mods;
  }

  getStats(data) {
    const replicaItems = this.getReplicaItems(data);
    const uniqueItems = this.getUniqueItems(data);
    const rareItems = this.getRareItems(data);
    const heistBases = this.getHeistBaseItems(data);
    const trinkets = this.getThiefTrinkets(data);
    const clsasNames = this.getAllClassNames(data);
    const rareMods = this.getRareItemMods(data);
    const trinketMods = this.getTrinketMods(data);
    const enchantedMods = this.getEnchantedMods(data);

    const classCounts = {};
    clsasNames.forEach((className) => {
      classCounts[className] = (classCounts[className] || 0) + 1;
    });

    const partialHeists = data.filter((item) => item.Partial === true).length;

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
      partialHeists: partialHeists,
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
}
