const fs = require("fs");
const path = require("path");

// This script can be run during Netlify build to generate CSS from environment variables
function generateCSSFromEnv() {
  const figmaData = process.env.FIGMA_DATA;

  if (!figmaData) {
    console.log("No FIGMA_DATA environment variable found, using default colors");
    return;
  }

  try {
    const data = JSON.parse(figmaData);
    const globalsCSSPath = path.join(process.cwd(), "app", "globals.css");

    // Read current CSS
    const currentCSS = fs.readFileSync(globalsCSSPath, "utf8");

    // Generate new @theme section
    let newThemeSection = `@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);`;

    // Add brand colors from Figma data
    if (data.collections && data.collections.length > 0) {
      const collection = data.collections[0];
      if (collection.variables) {
        collection.variables.forEach((variable) => {
          const colorName = variable.name.toLowerCase().replace("/", "-");
          const firstMode = Object.keys(variable.values)[0];
          if (firstMode && variable.values[firstMode] && variable.values[firstMode].hex) {
            const hexValue = variable.values[firstMode].hex;
            newThemeSection += `\n  --color-${colorName}: ${hexValue};`;
          }
        });
      }
    }

    newThemeSection += `\n}`;

    // Replace @theme section
    const updatedCSS = currentCSS.replace(/@theme inline\s*\{[\s\S]*?\}/, newThemeSection);

    // Write updated CSS
    fs.writeFileSync(globalsCSSPath, updatedCSS, "utf8");
    console.log("✅ CSS generated from Figma data during build");
  } catch (error) {
    console.error("❌ Error generating CSS from Figma data:", error);
  }
}

generateCSSFromEnv();
