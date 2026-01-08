export class ErrorHandler {
  constructor() {
    this.errorContainer = null;
  }

  showError(message, type = "error") {
    if (!this.errorContainer) {
      this.createErrorContainer();
    }

    const errorDiv = document.createElement("div");
    errorDiv.className = `error-message ${type}`;
    errorDiv.innerHTML = `
            <span class="error-icon">${type === "error" ? "❌" : "⚠️"}</span>
            <span class="error-text">${message}</span>
            <button class="error-close" onclick="this.parentElement.remove()">×</button>
        `;

    this.errorContainer.appendChild(errorDiv);

    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 5000);
  }

  createErrorContainer() {
    this.errorContainer = document.createElement("div");
    this.errorContainer.id = "error-container";
    this.errorContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
        `;
    document.body.appendChild(this.errorContainer);
  }

  clearErrors() {
    if (this.errorContainer) {
      this.errorContainer.innerHTML = "";
    }
  }
}
