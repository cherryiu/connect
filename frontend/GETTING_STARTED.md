# 🚀 Getting Started: Expo Bare Workflow with TypeScript + Bun

This guide walks you through creating a new Expo Bare TypeScript project using Bun, with structured setup including Redux, ESLint, Prettier, Jest, and folder organization.

## 📦 Prerequisites

Node.js >= 18

Bun

Git

Expo CLI → bun add -g expo-cli

## 🛠️ Create a New Project

```
bun create expo@latest MyApp
cd MyApp
bun install
npx expo eject
```

Choose Bare workflow and enable TypeScript when prompted.

## 🗂 Project Structure

Create project folders:

```
mkdir -p src/{components,screens,api,hooks,redux,context,navigation,constants,theme,types,enums,utils}
touch src/redux/store.ts
```

## 📚 TypeScript Setup

Ensure tsconfig.json exists. If not, create:

```
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["esnext"],
    "module": "esnext",
    "jsx": "react-native",
    "strict": true,
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    },
    "allowJs": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

## 📦 Install Dependencies

App Essentials

```
bun add @reduxjs/toolkit react-redux
bun add @react-navigation/native @react-navigation/native-stack
bun add react-native-screens react-native-safe-area-context react-native-gesture-handler
```

Dev Tools

```
bun add -D eslint prettier
bun add -D jest @types/jest ts-jest
bun add -D @testing-library/react-native @testing-library/jest-native
```

## 🧹 ESLint & Prettier

**.eslintrc.js**

```
module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  plugins: ['react', 'react-hooks'],
  parser: '@typescript-eslint/parser',
  rules: {
    'react/react-in-jsx-scope': 'off',
  },
};
```

**.prettierrc**

```
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 80
}
```

## 🥪 Jest Setup

**jest.config.js**

```
module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: ['node_modules/(?!(jest-)?react-native)'],
};
```

**jest.setup.js**

```
import '@testing-library/jest-native/extend-expect';
```

**Example test: **tests**/App.test.tsx**

```
import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../src/App';

test('renders correctly', () => {
  const { getByText } = render(<App />);
  expect(getByText('Welcome')).toBeTruthy();
});
```

## 🌍 Environment Variables

**Install dotenv parser:**

```
bun add react-native-dotenv
```

**.babel.config.js**

```
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [['module:react-native-dotenv']],
};
```

**.env**

```
API_URL=https://api.example.com
APP_ENV=development
```

**Then use:**

```
import { API_URL } from '@env';
```

## 🌟 Done!

You now have a fully functional, modern, scalable React Native (Expo Bare) TypeScript setup using Bun 🧑‍💻
