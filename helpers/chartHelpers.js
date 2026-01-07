export class ChartHelper {
    createReplicaChartData(replicaItems) {
        const replicaCounts = {};
        replicaItems.forEach(item => {
            const name = item.DisplayName;
            replicaCounts[name] = (replicaCounts[name] || 0) + 1;
        });
        
        const sorted = Object.entries(replicaCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        return {
            labels: sorted.map(([name]) => this.truncate(name, 25)),
            datasets: [{
                label: 'Count',
                data: sorted.map(([, count]) => count),
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        };
    }
    
    createClassChartData(classNames) {
        const classCounts = {};
        classNames.forEach(className => {
            if (className) {
                classCounts[className] = (classCounts[className] || 0) + 1;
            }
        });
        
        const sorted = Object.entries(classCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
        
        return {
            labels: sorted.map(([name]) => name),
            datasets: [{
                data: sorted.map(([, count]) => count),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#C9CBCF', '#E7E9ED'
                ].slice(0, sorted.length)
            }]
        };
    }
    
    createModsChartData(mods, limit = 10) {
        const modCounts = {};
        mods.forEach(mod => {
            modCounts[mod] = (modCounts[mod] || 0) + 1;
        });
        
        const sorted = Object.entries(modCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);
        
        return {
            labels: sorted.map(([mod]) => this.truncate(mod, 30)),
            datasets: [{
                label: 'Frequency',
                data: sorted.map(([, count]) => count),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        };
    }
    
    createTrinketModsChartData(mods) {
        const modCounts = {};
        mods.forEach(mod => {
            modCounts[mod] = (modCounts[mod] || 0) + 1;
        });
        
        const sorted = Object.entries(modCounts)
            .sort((a, b) => b[1] - a[1]);
        
        if (sorted.length === 0) {
            return {
                labels: ['No trinket mods found'],
                datasets: [{
                    label: 'Frequency',
                    data: [0],
                    backgroundColor: 'rgba(200, 200, 200, 0.5)',
                    borderColor: 'rgba(200, 200, 200, 1)',
                    borderWidth: 1
                }]
            };
        }
        
        const cleanedLabels = sorted.map(([mod]) => {
            let cleaned = mod;
            if (cleaned.includes('% chance to receive additional')) {
                cleaned = cleaned.replace('% chance to receive additional ', '');
                cleaned = cleaned.replace(' items when opening a Reward Chest in a Heist', '');
                cleaned = cleaned.replace(' when opening a Reward Chest in a Heist', '');
            } else if (cleaned.includes('% chance in Heists for')) {
                cleaned = cleaned.replace('% chance in Heists for ', '');
                cleaned = cleaned.replace(' to drop as ', '→');
                cleaned = cleaned.replace(' instead', '');
                cleaned = cleaned.replace(' to drop with an additional ', '+');
            }
            return this.truncate(cleaned, 35);
        });
        
        return {
            labels: cleanedLabels,
            datasets: [{
                label: 'Frequency',
                data: sorted.map(([, count]) => count),
                backgroundColor: 'rgba(153, 102, 255, 0.7)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        };
    }
    
    truncate(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
}