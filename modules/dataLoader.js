import { CSVProcessor } from '../helpers/csvParser.js';
import { DataProcessor } from '../helpers/dataProcessor.js';

export class DataLoader {
    constructor() {
        this.data = [];
        this.processor = new DataProcessor();
    }
    
    loadCSV(csvText) {
        const parser = new CSVProcessor(csvText);
        this.data = parser.parse();
        return this.data;
    }
    
    getReplicaItems() {
        return this.processor.getReplicaItems(this.data);
    }
    
    getRareItems() {
        return this.processor.getRareItems(this.data);
    }
    
    getThiefTrinkets() {
        return this.processor.getThiefTrinkets(this.data);
    }
    
    getAllClassNames() {
        return this.processor.getAllClassNames(this.data);
    }
    
    getActualClassNames() {
        return this.processor.getActualClassNames(this.data);
    }
    
    getRareItemMods() {
        return this.processor.getRareItemMods(this.data);
    }
    
    getTrinketMods() {
        return this.processor.getTrinketMods(this.data);
    }
    
    getEnchantedMods() {
        return this.processor.getEnchantedMods(this.data);
    }
    
    getStats() {
        return this.processor.getStats(this.data);
    }
}