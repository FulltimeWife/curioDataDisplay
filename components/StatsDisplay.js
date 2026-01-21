export class StatsDisplay {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  update(stats) {
    if (!this.container) return;

    const html = `
            <div class="stat-item">
                <div class="label">Total Items</div>
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
            <div class="stat-item">
                <div class="label">Unique Classes</div>
                <div class="value">${stats.uniqueClasses}</div>
            </div>
            <div class="stat-item">
                <div class="label">Wings Ran in Pohx Keepers Restart (PL77970)(Roughly 40% of overall)</div>
                <div class="value">${Math.round(stats.totalItems / 5)}</div>
            </div>
            
        `;

    this.container.innerHTML = html;
  }
}
