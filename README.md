<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1lpGjQkwyFVMXre2vvyzFwvSwYTOyCrCP

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Code Review Agent

This project includes an automated code review agent that helps maintain code quality and consistency.

### Features

- **ESLint**: Enforces Angular and TypeScript best practices
- **Prettier**: Ensures consistent code formatting
- **GitHub Actions**: Automated code review on every push and pull request
- **Type Safety**: TypeScript compilation checks

### Available Commands

```bash
# Run code review (format check + lint)
npm run code-review

# Check code formatting
npm run format:check

# Auto-fix formatting issues
npm run format

# Run linter
npm run lint

# Auto-fix linting issues where possible
npm run lint:fix
```

### GitHub Actions Workflow

The code review agent automatically runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

The workflow includes:
1. Code formatting verification
2. ESLint checks for code quality
3. TypeScript compilation verification
4. Application build

### Configuration Files

- `.eslintrc.json` - ESLint configuration for Angular/TypeScript
- `.prettierrc.json` - Prettier formatting rules
- `.prettierignore` - Files to exclude from formatting
- `.github/workflows/code-review.yml` - Automated CI/CD pipeline
