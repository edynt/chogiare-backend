#!/usr/bin/env node

/**
 * Script to merge all Prisma schema files into one
 * Usage: node scripts/merge-schema.js
 */

const fs = require('fs');
const path = require('path');

const schemaDir = path.join(__dirname, '../prisma/schema');
const outputFile = path.join(__dirname, '../prisma/schema.prisma');

// Order of schema files (important for dependencies)
const schemaFiles = [
  'base.prisma',
  'enums.prisma',
  'users.prisma',
  'wholesale.prisma',
  'stores.prisma',
  'categories.prisma',
  'products.prisma',
  'inventory.prisma',
  'addresses.prisma',
  'cart.prisma',
  'orders.prisma',
  'shipping.prisma',
  'reviews.prisma',
  'boost.prisma',
  'payments.prisma',
  'chat.prisma',
  'notifications.prisma',
];

let mergedContent = '';

// Read and merge all schema files
schemaFiles.forEach((file) => {
  const filePath = path.join(schemaDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    mergedContent += `// ============================================\n`;
    mergedContent += `// ${file}\n`;
    mergedContent += `// ============================================\n\n`;
    mergedContent += content;
    mergedContent += '\n\n';
  } else {
    console.warn(`Warning: ${file} not found`);
  }
});

// Write merged content
fs.writeFileSync(outputFile, mergedContent, 'utf8');
console.log(`✅ Merged ${schemaFiles.length} schema files into schema.prisma`);

