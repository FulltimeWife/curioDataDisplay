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
                <div class="label">Rare Items</div>
                <div class="value">${stats.rareItems}</div>
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
                <div class="label">Top Class</div>
                <div class="value">${stats.topClasses[0]?.name || 'N/A'} (${stats.topClasses[0]?.count || 0})</div>
            </div>
        `;
        
        this.container.innerHTML = html;
    }
}