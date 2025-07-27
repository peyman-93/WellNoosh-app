#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define import path mappings
const importMappings = {
  // Components
  '@/components/ui/': '@/components/ui/',
  '@/components/v3/': '@/components/features/',
  '@/components/StarRating': '@/components/shared/StarRating',
  '@/components/iphone/': '@/components/iphone/',

  // Screens
  '@/screens/WelcomeScreen': '@/screens/auth/WelcomeScreen',
  '@/screens/SignInScreen': '@/screens/auth/SignInScreen', 
  '@/screens/SignUpScreen': '@/screens/auth/SignUpScreen',
  '@/screens/FamilyChoiceScreen': '@/screens/modals/FamilyChoiceScreen',
  '@/screens/FamilyMemberSelectionScreen': '@/screens/modals/FamilyMemberSelectionScreen',
  '@/screens/onboarding/': '@/screens/onboarding/',
  '@/screens/tabs/': '@/screens/tabs/',
  '@/screens/community/': '@/screens/community/',
  
  // Services, Context, etc
  '@/context/': '@/context/',
  '@/hooks/': '@/hooks/',
  '@/services/': '@/services/',
  '@/types/': '@/types/',
  '@/lib/': '@/utils/'
};

function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    for (const [oldPath, newPath] of Object.entries(importMappings)) {
      const regex = new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(oldPath)) {
        content = content.replace(regex, newPath);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('node_modules') && !file.startsWith('.')) {
      walkDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      updateImportsInFile(fullPath);
    }
  }
}

// Start from the src directory
const srcDir = path.join(__dirname, '..', 'src');
const rootDir = path.join(__dirname, '..');

console.log('Updating import paths...');
walkDirectory(srcDir);

// Also check root files like App.tsx
const rootFiles = ['App.tsx', 'index.ts'];
for (const file of rootFiles) {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    updateImportsInFile(filePath);
  }
}

console.log('Import path updates complete!');