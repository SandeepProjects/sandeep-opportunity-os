import fs from 'fs';
import path from 'path';

console.log("Building Sandeep Opportunity OS...");

const distDir = path.resolve('dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

fs.writeFileSync(path.join(distDir, 'index.html'), '<!DOCTYPE html><html><body><h1>Sandeep Opportunity OS</h1></body></html>');
console.log("Build completed successfully emitting dist/ directory.");
