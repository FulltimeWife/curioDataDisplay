import { ChartHelper } from "../helpers/chartHelpers.js";

export class ChartManager {
  constructor() {
    this.charts = new Map();
    this.chartHelper = new ChartHelper();
  }

  createChart(config) {
    const { canvasId, type, data, options = {} } = config;
    const ctx = document.getElementById(canvasId);

    if (!ctx) {
      console.error(`Canvas element not found: ${canvasId}`);
      return null;
    }

    if (this.charts.has(canvasId)) {
      this.charts.get(canvasId).destroy();
    }

    const defaultOptions = {
      indexAxis: "y",
      aspectRatio: 1,
      plugins: {
        legend: {
          display: type === "pie" || type === "doughnut",
        },
      },
    };

    const chart = new Chart(ctx, {
      type: type,
      data: data,
      options: { ...defaultOptions, ...options },
    });

    this.charts.set(canvasId, chart);
    return chart;
  }

  createReplicaChart(data) {
    const chartData = this.chartHelper.createReplicaChartData(data);
    return this.createChart({
      canvasId: "replicaChart",
      type: "bar",
      data: chartData,
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              title: (tooltipItems) => {
                return chartData.labels[tooltipItems[0].dataIndex];
              },
            },
          },
        },
      },
    });
  }

  createUniqueChart(data) {
    const chartData = this.chartHelper.createUniqueChartData(data);
    return this.createChart({
      canvasId: "uniqueChart",
      type: "bar",
      data: chartData,
    });
  }

  createClassChart(classNames) {
    const chartData = this.chartHelper.createClassChartData(classNames);
    return this.createChart({
      canvasId: "classChart",
      type: "pie",
      data: chartData,
    });
  }

  createHeistBaseChart(heistBases) {
    const chartData = this.chartHelper.createHeistBaseChartData(heistBases);
    return this.createChart({
      canvasId: "heistBaseChart",
      type: "pie",
      data: chartData,
    });
  }

  createRareModsChart(mods) {
    const chartData = this.chartHelper.createModsChartData(mods, 15);
    return this.createChart({
      canvasId: "rareModsChart",
      type: "bar",
      data: chartData,
    });
  }

  createTrinketModsChart(mods) {
    const chartData = this.chartHelper.createTrinketModsChartData(mods, 15);
    return this.createChart({
      canvasId: "trinketModsChart",
      type: "bar",
      data: chartData,
    });
  }

  createEnchantedModsChart(mods) {
    const chartData = this.chartHelper.createModsChartData(mods, 10);
    return this.createChart({
      canvasId: "enchantedModsChart",
      type: "bar",
      data: chartData,
    });
  }

  destroyAll() {
    this.charts.forEach((chart) => chart.destroy());
    this.charts.clear();
  }
}
