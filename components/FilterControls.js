export class FilterControls {
  constructor(containerId, onFilterChange) {
    this.container = document.getElementById(containerId);
    this.onFilterChange = onFilterChange;
    this.leagueSelect = null;
    this.zoneSelect = null;
  }

  render(leagues = ["all"], zones = ["all"]) {
    if (!this.container) {
      console.error("Filter container not around");
      return;
    }

    this.container.innerHTML = `
    <div class="filter-controls">
      <div class="filter-group">
        <label for="leagueFilter"> League: </label>
        <select id="leagueFilter" class="filter-select">
          ${leagues
            .map(
              (league) =>
                `<option value="${league}">${league === "all" ? "All Leagues" : league}</option>`,
            )
            .join("")}
        </select>
      </div>

      <div class="filter-group">
        <label for="zoneFilter">Zone: </label>
        <select id="zoneFilter" class="filter-select">
          ${zones
            .map(
              (zone) =>
                `<option value="${zone}">${zone === "all" ? "All Zones" : zone}</option>`,
            )
            .join("")}
      </select>
      </div>

      <button id="resetFilters" class="filter-reset"> Reset Filters</button>
      </div>
    `;

    this.leagueSelect = document.getElementById("leagueFilter");
    this.zoneSelect = document.getElementById("zoneFilter");
    const resetBtn = document.getElementById("resetFilters");
  }

  handleFilterChange() {
    const league = this.leagueSelect.value;
    const zone = this.zoneSelect.value;

    if (this.onFilterChange) {
      this.onFilterChange(league, zone);
    }
  }

  resetFilters() {
    this.leagueSelect.value = "all";
    this.zoneSelect.value = "all";
    this.handleFilterChange();
  }

  getCurrentFilters() {
    return {
      league: this.leagueSelect?.value || "all",
      zone: this.zoneSelect?.value || "all",
    };
  }
}
