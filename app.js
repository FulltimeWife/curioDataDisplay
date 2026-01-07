import { DataLoader } from './modules/dataLoader.js';
import { ChartManager } from './modules/chartManager.js';
import { FileWatcher } from './modules/fileWatcher.js';
import { StatsDisplay } from './components/StatsDisplay.js';
import { ErrorHandler } from './components/ErrorHandler.js';

class HeistAnalyzer {
    constructor() {
        this.dataLoader = new DataLoader();
        this.chartManager = new ChartManager();
        this.fileWatcher = new FileWatcher();
        this.statsDisplay = new StatsDisplay('statsDisplay');
        this.errorHandler = new ErrorHandler();
        
        this.initialize();
    }
    
    async initialize() {
        this.updateStatus('offline');
        this.setupEventHandlers();
        
        await this.checkServerHealth();
        
        this.fileWatcher.connect();
        
        this.setupFileWatcherCallbacks();
    }
    
    setupEventHandlers() {
        const checkHealthBtn = document.createElement('button');
        checkHealthBtn.textContent = 'Check Server Health';
        checkHealthBtn.style.cssText = `
            margin: 10px;
            padding: 8px 16px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        checkHealthBtn.onclick = () => this.checkServerHealth();
        
        const statusBar = document.querySelector('.status-bar');
        if (statusBar) {
            statusBar.appendChild(checkHealthBtn);
        }
    }
    
    async checkServerHealth() {
        try {
            const health = await this.fileWatcher.checkHealth();
            if (health.status === 'ok') {
                this.updateStatus('online');
                this.errorHandler.showError(`Connected to server. Watching: ${health.file}`, 'success');
            } else {
                this.updateStatus('offline');
                this.errorHandler.showError('Server is not responding', 'error');
            }
        } catch (error) {
            this.updateStatus('offline');
            this.errorHandler.showError('Cannot connect to server. Make sure server.js is running.', 'error');
        }
    }
    
    setupFileWatcherCallbacks() {
        this.fileWatcher.onConnect(() => {
            this.updateStatus('online');
            this.errorHandler.clearErrors();
        });
        
        this.fileWatcher.onError((message) => {
            this.updateStatus('offline');
            this.errorHandler.showError(message, 'error');
        });
        
        this.fileWatcher.onUpdate((data) => {
            this.handleFileUpdate(data);
        });
    }
    
    handleFileUpdate(data) {
        try {
            this.updateStatus('online');
            
            if (data.type === 'error') {
                this.errorHandler.showError(data.message, 'error');
                return;
            }
            
            this.updateFileStatus(data.stats);
            
            this.dataLoader.loadCSV(data.data);
            const stats = this.dataLoader.getStats();
            
            this.statsDisplay.update(stats);
            this.createCharts();
            
            const timeStr = new Date().toLocaleTimeString();
            document.getElementById('updateTime').textContent = `Last Update: ${timeStr}`;
            
            console.log(`Data updated at ${timeStr} - ${stats.totalItems} items loaded`);
            
        } catch (error) {
            console.error('Error processing file update:', error);
            this.errorHandler.showError('Error processing data: ' + error.message, 'error');
        }
    }
    
    createCharts() {
        this.chartManager.destroyAll();
        
        this.chartManager.createReplicaChart(this.dataLoader.getReplicaItems());
        this.chartManager.createClassChart(this.dataLoader.getActualClassNames());
        this.chartManager.createRareModsChart(this.dataLoader.getRareItemMods());
        this.chartManager.createTrinketModsChart(this.dataLoader.getTrinketMods());
        this.chartManager.createEnchantedModsChart(this.dataLoader.getEnchantedMods());
    }
    
    updateStatus(status) {
        const serverStatus = document.getElementById('serverStatus');
        if (serverStatus) {
            serverStatus.textContent = `Server: ${status === 'online' ? 'Online' : 'Offline'}`;
            serverStatus.className = `status ${status}`;
        }
    }
    
    updateFileStatus(stats) {
        const fileStatus = document.getElementById('fileStatus');
        const filePath = document.getElementById('filePath');
        
        if (fileStatus) {
            if (stats && stats.exists) {
                const sizeKB = Math.round(stats.size / 1024);
                const timeStr = new Date(stats.modified).toLocaleTimeString();
                fileStatus.textContent = `File: ${sizeKB}KB (${timeStr})`;
                fileStatus.className = 'status online';
            } else {
                fileStatus.textContent = 'File: Not Found';
                fileStatus.className = 'status offline';
            }
        }
        
        if (filePath) {
            filePath.textContent = 'D:/AntiBeltMeasure/CoreJ/Plugins/Temp/CurioDataScience/heist_rewards.csv';
        }
    }
    
    cleanup() {
        this.fileWatcher.disconnect();
        this.chartManager.destroyAll();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new HeistAnalyzer();
});

window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.cleanup();
    }
});