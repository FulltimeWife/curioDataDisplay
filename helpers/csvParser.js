export class CSVProcessor {
  constructor(csvText) {
    this.csvText = csvText;
    this.headers = [];
    this.data = [];
  }

  parse() {
    const lines = this.splitCSVLines(this.csvText);

    const rawHeaders = this.parseCSVLine(lines[0]);
    this.headers = rawHeaders.map((header) => this.cleanHeader(header));

    this.data = lines
      .slice(1)
      .filter((line) => line.trim())
      .map((line, index) => {
        const values = this.parseCSVLine(line);
        const item = {};

        this.headers.forEach((header, headerIndex) => {
          const value = headerIndex < values.length ? values[headerIndex] : "";
          item[header] = this.cleanText(value);
        });

        return item;
      });

    return this.data;
  }

  splitCSVLines(csvText) {
    const lines = [];
    let currentLine = "";
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"' && nextChar === '"' && inQuotes) {
        currentLine += '""';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
        currentLine += char;
      } else if (char === "\n" && !inQuotes) {
        lines.push(currentLine);
        currentLine = "";
      } else if (char === "\r") {
        continue;
      } else {
        currentLine += char;
      }
    }

    if (currentLine.trim() !== "") {
      lines.push(currentLine);
    }

    return lines;
  }

  parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && nextChar === '"' && inQuotes) {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  cleanText(text) {
    if (!text || text === "undefined") return "";
    return text.replace(/^"|"$/g, "").trim();
  }

  cleanHeader(header) {
    if (!header) return "";
    return header.replace(/^"|"$/g, "").replace(/\n/g, "").trim();
  }
}
