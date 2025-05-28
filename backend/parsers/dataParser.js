function parseText(text, FIELD_PATTERNS, TAX_CODES) {
  const data = {};
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    // Check field patterns
    for (const { key, regex } of FIELD_PATTERNS) {
      if (!data[key]) {
        const match = line.match(regex);
        if (match) {
          const value = match[1].trim();
          if (value && value !== "-") {
            data[key] = value;
          } else {
            data[key] = "";
          }
        }
      }
    }

    // Check tax codes
    const codeAmountRegex = /(?:^|\s)(\d{3,5})\s{1,10}([\d,\.]+)/gm;
    let match;
    while ((match = codeAmountRegex.exec(line)) !== null) {
      const code = match[1];
      const amount = Number(match[2].replace(/,/g, ""));
      if (TAX_CODES[code]) {
        data[TAX_CODES[code]] = amount;
      }
    }
  }

  return data;
}

module.exports = { parseText };
