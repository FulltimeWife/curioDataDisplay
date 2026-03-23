export class DropRateDisplay {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  formatRate(count, wings) {
    if (!wings || wings === 0) return { perWing: "-", percent: "-" };
    const perWing = count / wings;
    const percent = perWing * 100;
    return {
      perWing: perWing.toFixed(3).replace(/\.?0+$/, ""),
      percent: percent.toFixed(2) + "%",
    };
  }

  groupCounts(items, keyProp) {
    const counts = {};
    (items || []).forEach((item) => {
      const name =
        item[keyProp] || item.DisplayName || item.BaseName || "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }

  renderTable(title, rows, wings) {
    if (!rows || rows.length === 0) {
      return `
        <div class="drop-rate-section">
          <h4>${title}</h4>
          <div class="empty">No items</div>
        </div>
      `;
    }

    const rowsHtml = rows
      .map((r) => {
        const rate = this.formatRate(r.count, wings);
        return `
          <tr>
            <td class="item-name" title="${r.name}">${r.name}</td>
            <td class="count">${r.count}</td>
            <td class="wings">${wings || "-"}</td>
            <td class="perwing">${rate.perWing}</td>
            <td class="percent">${rate.percent}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <div class="drop-rate-section">
        <h4>${title}</h4>
        <div class="drop-rate-table-wrapper">
          <table class="drop-rate-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Count</th>
                <th>Wings</th>
                <th>Per wing</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  update({
    replicaItems = [],
    heistBaseItems = [],
    uniqueItems = [],
    wingsRan = 0,
  } = {}) {
    if (!this.container) return;

    const replicaRows = this.groupCounts(replicaItems, "DisplayName").sort(
      (a, b) => b.count - a.count,
    );
    const heistRows = this.groupCounts(heistBaseItems, "BaseName").sort(
      (a, b) => b.count - a.count,
    );
    const uniqueRows = this.groupCounts(uniqueItems, "DisplayName").sort(
      (a, b) => b.count - a.count,
    );

    const html = `
      <div class="drop-rate-grid">
        ${this.renderTable("Replica items", replicaRows, wingsRan)}
        ${this.renderTable("Heist bases", heistRows, wingsRan)}
        ${this.renderTable("Uniques", uniqueRows, wingsRan)}
      </div>
    `;

    this.container.innerHTML = html;
  }
}
