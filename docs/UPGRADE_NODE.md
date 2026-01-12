# Upgrade Node.js - Required!

Your current Node.js version (10.19.0) is too old. Next.js 14 requires Node.js 18.17.0 or higher.

## Quick Fix - Install Node.js 20 (Recommended)

Run these commands in your terminal:

```bash
# Download and install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

You should see:
- Node.js version: v20.x.x or higher
- npm version: 10.x.x or higher

## Alternative: Use NVM (Node Version Manager)

If you prefer to manage multiple Node.js versions:

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload your shell
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20

# Verify
node --version
```

## After Upgrading

Once Node.js is upgraded, come back to the project and run:

```bash
cd MarketingBotPro
npm install
npm run dev
```

## Troubleshooting

If you get permission errors, you might need to:
1. Use `sudo` for the installation commands
2. Or use NVM (which doesn't require sudo)

If you're still having issues, you can also download Node.js directly from:
https://nodejs.org/ (Download the LTS version)
