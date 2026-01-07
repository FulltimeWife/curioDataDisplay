export class FileWatcher {
    constructor() {
        this.eventSource = null;
        this.callbacks = {
            onUpdate: null,
            onError: null,
            onConnect: null
        };
    }
    
    connect(url = 'http://localhost:3000/api/stream') {
        this.disconnect();
        
        this.eventSource = new EventSource(url);
        
        this.eventSource.onopen = () => {
            console.log('Connected to file stream');
            if (this.callbacks.onConnect) {
                this.callbacks.onConnect();
            }
        };
        
        this.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                switch (data.type) {
                    case 'init':
                    case 'update':
                        if (this.callbacks.onUpdate) {
                            this.callbacks.onUpdate(data);
                        }
                        break;
                    case 'error':
                        if (this.callbacks.onError) {
                            this.callbacks.onError(data.message);
                        }
                        break;
                }
            } catch (error) {
                console.error('Error parsing SSE data:', error);
            }
        };
        
        this.eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError('Connection lost. Attempting to reconnect...');
            }
            
            setTimeout(() => this.connect(url), 5000);
        };
    }
    
    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }
    
    onUpdate(callback) {
        this.callbacks.onUpdate = callback;
    }
    
    onError(callback) {
        this.callbacks.onError = callback;
    }
    
    onConnect(callback) {
        this.callbacks.onConnect = callback;
    }
    
    checkHealth() {
        return fetch('http://localhost:3000/api/health')
            .then(response => response.json())
            .catch(() => ({ status: 'error', message: 'Server unavailable' }));
    }
}