export class StatsDisplay {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  update(stats) {
    if (!this.container) return;

    let html = "";

    html += `
        <div class="stat-item">
            <div class="label"> Total Items</div>
            <div class="value">${stats.totalItems}</div>
        </div>
        <div class="stat-item">
            <div class="label">Replica Items</div>
            <div class="value">${stats.replicaItems}</div>
        </div>
        <div class="stat-item">
            <div class="label">Heist Uniques</div>
            <div class="value">${stats.uniqueItems}</div>
        </div>
        <div class="stat-item">
            <div class="label">Rare Items</div>
            <div class="value">${stats.rareItems}</div>
        </div>
        <div class="stat-item">
            <div class="label">Heist Bases</div>
            <div class="value">${stats.heistBases}</div>
        </div>
        <div class="stat-item">
            <div class="label">Trinkets</div>
            <div class="value">${stats.trinkets}</div>
        </div>
    `;

    if (stats.wingStats) {
      html += `
        <div class="stat-item highlight">
            <div class="label">Total Wings</div>
            <div class="value">${stats.wingStats.totalWings}</div>
        </div>
        `;

      const zoneEntries = Object.entries(stats.wingStats.wingsByZone)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      if (zoneEntries.length > 0) {
        html += `
            <div class="stat-item wide">
                <div class="label">Top Zones</div>
                <div class="value-list">
                    ${zoneEntries.map(([zone, count]) => `<span class="zone-stat">${zone}: ${count}</spam`).join("")}
                </div>
            </div>
            `;
      }
    } else {
      html += `
        <div class="stat-item">
            <div class="label">Estimated Wings</div>
            <div class="value">${Math.round(stats.totalItems / 5)}</div>
        `;
    }

    this.container.innerHTML = html;
  }
}
