import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// Function to update only the @theme section in globals.css
function updateThemeSection(figmaData: any): boolean {
  try {
    // Get the path to globals.css
    const globalsCSSPath = join(process.cwd(), "app", "globals.css");

    // Read the current CSS file
    const currentCSS = readFileSync(globalsCSSPath, "utf8");

    // Generate new @theme section with brand colors
    let newThemeSection = `@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);`;

    // Add brand colors from Figma data
    if (figmaData.collections && figmaData.collections.length > 0) {
      const collection = figmaData.collections[0];
      if (collection.variables) {
        collection.variables.forEach((variable: any) => {
          // Extract color name (e.g., "Brand/100" -> "brand-100")
          const colorName = variable.name.toLowerCase().replace("/", "-");

          // Get the hex value from the first mode
          const firstMode = Object.keys(variable.values)[0];
          if (firstMode && variable.values[firstMode] && variable.values[firstMode].hex) {
            const hexValue = variable.values[firstMode].hex;
            newThemeSection += `\n  --color-${colorName}: ${hexValue};`;
          }
        });
      }
    }

    newThemeSection += `\n}`;

    // Replace the existing @theme section with the new one
    const updatedCSS = currentCSS.replace(/@theme inline\s*\{[\s\S]*?\}/, newThemeSection);

    // Write the updated CSS back to the file
    writeFileSync(globalsCSSPath, updatedCSS, "utf8");

    console.log("✅ @theme section updated successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to update @theme section:", error);
    return false;
  }
}

// Function to handle GitHub repository update
async function handleGitHubRepository(figmaData: any) {
  try {
    // Check if GitHub configuration is provided in the request
    if (!figmaData.github || !figmaData.github.owner || !figmaData.github.repo) {
      console.log("⚠️ GitHub configuration missing from request");
      return { success: false, message: "GitHub configuration missing from request" };
    }

    // Get GitHub token from environment variables
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.log("⚠️ GitHub token not configured");
      return { success: false, message: "GitHub token not configured" };
    }

    const { owner, repo } = figmaData.github;
    console.log(`🏢 Processing brand guide for: ${figmaData.figmaFile.name}`);
    console.log(`📦 Updating repository: ${owner}/${repo}`);

    // Generate files for the brand guide
    const files = await generateBrandGuideFiles(figmaData);

    // Update files in the repository
    let updatedFiles = 0;
    for (const file of files) {
      try {
        await createOrUpdateGitHubFile(owner, repo, file.path, file.content, file.message, githubToken);
        updatedFiles++;
        console.log(`✅ Updated: ${file.path}`);
      } catch (error) {
        console.error(`❌ Failed to update ${file.path}:`, error);
      }
    }

    console.log("✅ GitHub repository updated successfully");
    return {
      success: true,
      message: `Repository updated successfully. ${updatedFiles} files updated.`,
      repoUrl: `https://github.com/${owner}/${repo}`,
      repoName: repo,
      figmaFile: figmaData.figmaFile.name,
      filesUpdated: updatedFiles,
    };
  } catch (error) {
    console.error("❌ GitHub repository error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown GitHub error",
    };
  }
}

// Generate brand guide files
async function generateBrandGuideFiles(figmaData: any) {
  const cssContent = generateCSS(figmaData);
  const readmeContent = generateReadme(figmaData);
  const packageJson = generatePackageJson();
  const indexHtml = generateIndexHtml(figmaData);

  return [
    { path: "styles/colors.css", content: cssContent, message: "Update brand colors from Figma" },
    { path: "README.md", content: readmeContent, message: "Update brand guide documentation" },
    { path: "package.json", content: packageJson, message: "Add package.json for brand guide" },
    { path: "index.html", content: indexHtml, message: "Update brand guide HTML" },
  ];
}

// Generate CSS content
function generateCSS(figmaData: any): string {
  let css = `/* Brand Colors - Generated from Figma */
/* File: ${figmaData.figmaFile.name} */
/* Last Updated: ${figmaData.figmaFile.lastModified} */

:root {`;

  if (figmaData.collections && figmaData.collections.length > 0) {
    const collection = figmaData.collections[0];
    if (collection.variables) {
      collection.variables.forEach((variable: any) => {
        const colorName = variable.name.toLowerCase().replace("/", "-");
        const firstMode = Object.keys(variable.values)[0];
        if (firstMode && variable.values[firstMode] && variable.values[firstMode].hex) {
          const hexValue = variable.values[firstMode].hex;
          css += `\n  --color-${colorName}: ${hexValue};`;
        }
      });
    }
  }

  css += `\n}\n\n/* Usage Examples */\n`;
  css += `.brand-100 { background-color: var(--color-brand-100); }\n`;
  css += `.brand-200 { background-color: var(--color-brand-200); }\n`;
  css += `.brand-300 { background-color: var(--color-brand-300); }\n`;
  css += `.brand-400 { background-color: var(--color-brand-400); }\n`;
  css += `.brand-500 { background-color: var(--color-brand-500); }\n`;

  return css;
}

// Generate README content
function generateReadme(figmaData: any): string {
  const colors = figmaData.collections?.[0]?.variables || [];

  let readme = `# Brand Guide

Generated from Figma file: **${figmaData.figmaFile.name}**

Last updated: ${figmaData.figmaFile.lastModified}

## Color Palette

| Color | Variable | HEX | Usage |
|-------|----------|-----|-------|`;

  colors.forEach((variable: any) => {
    const colorName = variable.name.toLowerCase().replace("/", "-");
    const firstMode = Object.keys(variable.values)[0];
    const hexValue = (firstMode && variable.values[firstMode]?.hex) || "#000000";

    readme += `\n| ${variable.name} | \`--color-${colorName}\` | \`${hexValue}\` | Primary brand color |`;
  });

  readme += `\n\n## Usage\n\n\`\`\`css\n/* Use CSS variables */\n.my-element {\n  background-color: var(--color-brand-100);\n  color: var(--color-brand-900);\n}\n\`\`\`\n\n## Development\n\nThis brand guide is automatically generated from Figma variables.`;

  return readme;
}

// Generate package.json
function generatePackageJson(): string {
  return JSON.stringify(
    {
      name: "brand-guide",
      version: "1.0.0",
      description: "Brand guide generated from Figma",
      main: "index.html",
      scripts: {
        dev: "npx serve .",
        build: "echo 'No build step required'",
      },
      devDependencies: {
        serve: "^14.0.0",
      },
    },
    null,
    2
  );
}

// Generate index.html
function generateIndexHtml(figmaData: any): string {
  const colors = figmaData.collections?.[0]?.variables || [];

  let colorCards = "";
  colors.forEach((variable: any) => {
    const colorName = variable.name.toLowerCase().replace("/", "-");
    const firstMode = Object.keys(variable.values)[0];
    const hexValue = (firstMode && variable.values[firstMode]?.hex) || "#000000";

    colorCards += `
        <div class="color-card">
          <div class="color-preview" style="background-color: var(--color-${colorName})"></div>
          <h3>${variable.name}</h3>
          <p><code>--color-${colorName}</code></p>
          <p><code>${hexValue}</code></p>
        </div>`;
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brand Guide - ${figmaData.figmaFile.name}</title>
    <link rel="stylesheet" href="styles/colors.css">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .color-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .color-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .color-preview { height: 100px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e0e0e0; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Brand Guide</h1>
            <p>Generated from Figma file: <strong>${figmaData.figmaFile.name}</strong></p>
            <p>Last updated: ${figmaData.figmaFile.lastModified}</p>
        </div>
        <div class="color-grid">
            ${colorCards}
        </div>
    </div>
</body>
</html>`;
}

// Create or update a file in GitHub repository
async function createOrUpdateGitHubFile(owner: string, repo: string, path: string, content: string, message: string, token: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  try {
    // First, try to get the current file to get its SHA
    const currentFileResponse = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    let sha: string | undefined;
    if (currentFileResponse.ok) {
      const currentFile = await currentFileResponse.json();
      sha = currentFile.sha;
    }

    // Create or update the file
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(content).toString("base64"),
        ...(sha && { sha }),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`GitHub API error: ${response.status} - ${error.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming JSON data
    const data = await request.json();

    // Log the received data to console
    console.log("=== FIGMA WEBHOOK DATA RECEIVED ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Data:", JSON.stringify(data, null, 2));

    // Update only the @theme section
    const updateSuccess = updateThemeSection(data);

    // Handle GitHub repository update
    const githubResult = await handleGitHubRepository(data);

    // Log specific parts of the data for easier debugging
    if (data.collections) {
      console.log("\n=== COLLECTIONS ===");
      data.collections.forEach((collection: any, index: number) => {
        console.log(`Collection ${index + 1}: ${collection.name}`);
        console.log(`  ID: ${collection.id}`);
        console.log(`  Variables: ${collection.variables?.length || 0}`);

        if (collection.variables) {
          collection.variables.forEach((variable: any, varIndex: number) => {
            console.log(`    Variable ${varIndex + 1}: ${variable.name}`);
            console.log(`      Type: ${variable.type}`);
            console.log(`      Values:`, variable.values);
          });
        }
      });
    }

    // Return a success response with CORS headers
    return NextResponse.json(
      {
        success: true,
        message: updateSuccess ? "Data received and @theme section updated successfully" : "Data received but @theme update failed",
        timestamp: new Date().toISOString(),
        dataReceived: true,
        themeUpdated: updateSuccess,
        colorCount: data.collections?.[0]?.variables?.length || 0,
        github: githubResult,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("=== WEBHOOK ERROR ===");
    console.error("Error processing webhook:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error processing webhook data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json(
    {
      message: "Webhook endpoint is active",
      timestamp: new Date().toISOString(),
      method: "GET",
    },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
