export const Utils = {
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
  },
  cleanText(text) {
    if (!text || text === "undefined") return "";
    return text.replace(/^"|"$/g, "").trim();
  },

  cleanHeader(header) {
    if (!header) return "";
    return header.replace(/^"|"$/g, "").replace(/\n/g, "").trim();
  },
};
