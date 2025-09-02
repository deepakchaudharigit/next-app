#!/usr/bin/env node

/**
 * Create Placeholder PWA Icons
 * Generates simple placeholder icons to fix 404 errors
 */

const fs = require('fs')
const path = require('path')

console.log('🎨 Creating placeholder PWA icons...\n')

// Ensure icons directory exists
const iconsDir = 'public/icons'
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
  console.log('📁 Created icons directory')
}

// Icon sizes needed
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' }
]

// Create a simple SVG template
function createSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#4f46e5" rx="${size * 0.125}"/>
  <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="${size * 0.15}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">NPCL</text>
  <text x="50%" y="65%" font-family="Arial, sans-serif" font-size="${size * 0.08}" fill="#e0e7ff" text-anchor="middle" dominant-baseline="middle">Dashboard</text>
  <path d="M${size * 0.4} ${size * 0.25}L${size * 0.35} ${size * 0.35}h${size * 0.1}l-${size * 0.05} ${size * 0.1} ${size * 0.15}-${size * 0.1}h-${size * 0.1}l${size * 0.05}-${size * 0.1}z" fill="white"/>
</svg>`
}

// Create SVG files for each size
iconSizes.forEach(({ size, name }) => {
  const svgContent = createSVG(size)
  const svgPath = path.join(iconsDir, name.replace('.png', '.svg'))
  
  fs.writeFileSync(svgPath, svgContent)
  console.log(`✅ Created ${name.replace('.png', '.svg')} (${size}x${size})`)
})

// Create a simple favicon.ico equivalent
const faviconSvg = createSVG(32)
fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconSvg)
console.log('✅ Created favicon.svg')

// Create a simple manifest icon reference
const manifestUpdate = `
📝 Update your manifest.json icons array to use SVG files temporarily:

"icons": [
  {
    "src": "/icons/icon-72x72.svg",
    "sizes": "72x72",
    "type": "image/svg+xml"
  },
  {
    "src": "/icons/icon-96x96.svg", 
    "sizes": "96x96",
    "type": "image/svg+xml"
  },
  {
    "src": "/icons/icon-128x128.svg",
    "sizes": "128x128", 
    "type": "image/svg+xml"
  },
  {
    "src": "/icons/icon-144x144.svg",
    "sizes": "144x144",
    "type": "image/svg+xml"
  },
  {
    "src": "/icons/icon-152x152.svg",
    "sizes": "152x152",
    "type": "image/svg+xml"
  },
  {
    "src": "/icons/icon-192x192.svg",
    "sizes": "192x192",
    "type": "image/svg+xml",
    "purpose": "maskable any"
  },
  {
    "src": "/icons/icon-384x384.svg",
    "sizes": "384x384",
    "type": "image/svg+xml"
  },
  {
    "src": "/icons/icon-512x512.svg",
    "sizes": "512x512",
    "type": "image/svg+xml",
    "purpose": "maskable any"
  }
]
`

console.log('\n🎉 Placeholder icons created successfully!')
console.log('\n📋 Next steps:')
console.log('1. Restart your development server: npm run dev')
console.log('2. Check that 404 errors are gone')
console.log('3. For production, convert SVG to PNG using:')
console.log('   - Online tools: https://realfavicongenerator.net/')
console.log('   - Or open scripts/generate-icons.html in browser')
console.log('   - Or use ImageMagick: convert icon.svg icon.png')

console.log(manifestUpdate)

// Create a quick conversion script
const conversionScript = `#!/bin/bash
# Convert SVG icons to PNG using ImageMagick
# Run this if you have ImageMagick installed

cd public/icons

for size in 72 96 128 144 152 192 384 512; do
  if command -v convert &> /dev/null; then
    convert "icon-\${size}x\${size}.svg" "icon-\${size}x\${size}.png"
    echo "Converted icon-\${size}x\${size}.png"
  else
    echo "ImageMagick not found. Please install it or use online converter."
    break
  fi
done

# Convert apple touch icon
if command -v convert &> /dev/null; then
  convert "apple-touch-icon.svg" "apple-touch-icon.png"
  echo "Converted apple-touch-icon.png"
fi

echo "Conversion complete!"
`

fs.writeFileSync(path.join(iconsDir, 'convert-to-png.sh'), conversionScript)
fs.chmodSync(path.join(iconsDir, 'convert-to-png.sh'), '755')
console.log('\n🔧 Created convert-to-png.sh script for ImageMagick conversion')

console.log('\n✅ Setup complete! Your PWA icons should now load without 404 errors.')