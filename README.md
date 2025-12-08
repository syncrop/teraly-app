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

## Dependency Management

For information about updating and managing dependencies safely:
- 📚 [Dependency Update Guide](DEPENDENCY_UPDATE_GUIDE.md) - Comprehensive guide for updating dependencies
- 🔒 [Security Policy](SECURITY.md) - Security practices and vulnerability reporting

### Quick Commands

```bash
# Check for outdated packages
npm run check-updates

# Run security audit
npm run security-audit

# Safe update (recommended)
./update-dependencies.sh conservative

# Full update (test environment)
./update-dependencies.sh full
```
