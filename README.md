# Brand Guide Builder

A Figma-to-GitHub system that automatically updates repositories with brand colors and documentation extracted from Figma variables.

## Overview

This system allows designers to run a Figma plugin that automatically:

- Extracts brand colors from Figma variables
- Updates a GitHub repository with brand guides via a user-friendly UI
- Updates CSS files with the latest colors
- Generates documentation and visual guides

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables** in `.env.local`:

   ```bash
   GITHUB_TOKEN=your_github_personal_access_token_here
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Test the webhook** at `http://localhost:3000/api/webhook`

5. **Use the Figma plugin** to input repository details and generate brand guides

## How It Works

1. **Figma Plugin UI**: Users input GitHub repository information directly in the plugin
2. **Color Extraction**: Plugin extracts brand colors from Figma variables
3. **Webhook Processing**: Data is sent to the webhook with repository details
4. **Repository Update**: System updates the specified GitHub repository with brand guide files

## Figma Plugin Features

- **User-friendly UI** for entering GitHub repository details
- **Repository validation** and error handling
- **Settings persistence** using localStorage
- **Real-time status updates** during processing
- **Multiple webhook endpoint options** (local, Vercel, Netlify)

## Generated Files

- `styles/colors.css` - CSS variables for all brand colors
- `README.md` - Color palette documentation
- `index.html` - Visual brand guide
- `package.json` - Basic setup for serving the brand guide

## Environment Variables

| Variable       | Required | Description                       |
| -------------- | -------- | --------------------------------- |
| `GITHUB_TOKEN` | Yes      | Your GitHub personal access token |

## Development

This is a [Next.js](https://nextjs.org) project. The main webhook endpoint is at `/api/webhook` and handles Figma data to update GitHub repositories.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [GitHub API Documentation](https://docs.github.com/en/rest)
