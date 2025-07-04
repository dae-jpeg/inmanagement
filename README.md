# QRinventory Frontend

A modern React + TypeScript frontend for the QRinventory management system. This application provides a user-friendly interface for managing inventory, scanning QR codes and barcodes, and interacting with the multi-tenant Django backend.

## 🚀 Features

- 🔍 QR code and barcode scanning for items and users
- 📦 Inventory management dashboard
- 🧑‍💼 User authentication and profile management
- 🕑 Real-time updates and notifications
- 🏢 Multi-region (multi-tenancy) support
- 📊 History and transaction tracking
- 🎨 Responsive, modern UI with Tailwind CSS and Radix UI

## 🛠️ Technologies Used

- React 18 + TypeScript
- Vite (fast build and HMR)
- Tailwind CSS for styling
- Radix UI for accessible components
- Axios for API requests
- Supabase for optional integrations
- HTML5 QR/Barcode scanning libraries

## 📦 Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. The app will connect to the Django backend (see backend README for API setup).

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
