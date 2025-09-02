#!/usr/bin/env node

/**
 * PWA Icon Generator Helper
 * Provides instructions and templates for generating PWA icons
 */

const fs = require('fs')
const path = require('path')

console.log('🎨 PWA Icon Generator Helper\n')

// Create icons directory
const iconsDir = 'public/icons'
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
  console.log('📁 Created icons directory')
}

// Required icon sizes for PWA
const iconSizes = [
  { size: 72, purpose: 'Android Chrome' },
  { size: 96, purpose: 'Android Chrome' },
  { size: 128, purpose: 'Android Chrome' },
  { size: 144, purpose: 'Android Chrome, Windows' },
  { size: 152, purpose: 'iOS Safari' },
  { size: 192, purpose: 'Android Chrome (required)' },
  { size: 384, purpose: 'Android Chrome' },
  { size: 512, purpose: 'Android Chrome (required)' }
]

// Apple-specific icons
const appleIcons = [
  { size: 180, name: 'apple-touch-icon.png', purpose: 'iOS Safari' },
  { size: 167, name: 'apple-touch-icon-167x167.png', purpose: 'iPad Pro' },
  { size: 152, name: 'apple-touch-icon-152x152.png', purpose: 'iPad' },
  { size: 120, name: 'apple-touch-icon-120x120.png', purpose: 'iPhone' }
]

// Splash screen sizes for iOS
const splashSizes = [
  { width: 640, height: 1136, name: 'apple-splash-640-1136.png', device: 'iPhone 5/SE' },
  { width: 750, height: 1334, name: 'apple-splash-750-1334.png', device: 'iPhone 6/7/8' },
  { width: 1125, height: 2436, name: 'apple-splash-1125-2436.png', device: 'iPhone X/XS' },
  { width: 1242, height: 2208, name: 'apple-splash-1242-2208.png', device: 'iPhone 6+/7+/8+' },
  { width: 1536, height: 2048, name: 'apple-splash-1536-2048.png', device: 'iPad' },
  { width: 1668, height: 2388, name: 'apple-splash-1668-2388.png', device: 'iPad Pro 11"' },
  { width: 2048, height: 2732, name: 'apple-splash-2048-2732.png', device: 'iPad Pro 12.9"' }
]

console.log('📋 Required PWA Icons:\n')

// List required icons
console.log('🔸 Standard PWA Icons:')
iconSizes.forEach(icon => {
  const filename = `icon-${icon.size}x${icon.size}.png`
  const filepath = path.join(iconsDir, filename)
  const exists = fs.existsSync(filepath)
  
  console.log(`   ${exists ? '✅' : '❌'} ${filename} (${icon.size}x${icon.size}) - ${icon.purpose}`)
})

console.log('\n🔸 Apple Touch Icons:')
appleIcons.forEach(icon => {
  const filepath = path.join(iconsDir, icon.name)
  const exists = fs.existsSync(filepath)
  
  console.log(`   ${exists ? '✅' : '❌'} ${icon.name} (${icon.size}x${icon.size}) - ${icon.purpose}`)
})

console.log('\n🔸 iOS Splash Screens:')
splashSizes.forEach(splash => {
  const filepath = path.join(iconsDir, splash.name)
  const exists = fs.existsSync(filepath)
  
  console.log(`   ${exists ? '✅' : '❌'} ${splash.name} (${splash.width}x${splash.height}) - ${splash.device}`)
})

// Create placeholder SVG if no icons exist
const hasAnyIcon = iconSizes.some(icon => {
  const filename = `icon-${icon.size}x${icon.size}.png`
  return fs.existsSync(path.join(iconsDir, filename))
})

if (!hasAnyIcon) {
  console.log('\n🎨 Creating placeholder icons...')
  
  // Create a simple SVG template
  const svgTemplate = (size, text) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#4f46e5"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size/8}" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>`.trim()

  // Create placeholder SVG
  const placeholderSvg = svgTemplate(512, 'NPCL')
  fs.writeFileSync(path.join(iconsDir, 'icon-template.svg'), placeholderSvg)
  console.log('✅ Created icon-template.svg')
}

console.log('\n🛠 How to Generate Icons:\n')

console.log('📱 Option 1: Online Tools (Recommended)')
console.log('   1. Visit: https://realfavicongenerator.net/')
console.log('   2. Upload your logo (512x512 PNG recommended)')
console.log('   3. Configure settings for each platform')
console.log('   4. Download and extract to public/icons/')

console.log('\n🎨 Option 2: Design Tools')
console.log('   1. Create 512x512 master icon in Figma/Photoshop')
console.log('   2. Export in required sizes:')
iconSizes.forEach(icon => {
  console.log(`      - ${icon.size}x${icon.size} as icon-${icon.size}x${icon.size}.png`)
})

console.log('\n⚡ Option 3: Command Line (ImageMagick)')
console.log('   # Install ImageMagick first')
console.log('   # Then run these commands with your source image:')
console.log('')
iconSizes.forEach(icon => {
  console.log(`   convert source-icon.png -resize ${icon.size}x${icon.size} public/icons/icon-${icon.size}x${icon.size}.png`)
})

console.log('\n🍎 Option 4: iOS Splash Screens')
console.log('   # Create splash screens for iOS devices:')
splashSizes.forEach(splash => {
  console.log(`   # ${splash.device}: ${splash.width}x${splash.height}`)
})

console.log('\n📋 Icon Requirements:')
console.log('   ✅ PNG format')
console.log('   ✅ Square aspect ratio')
console.log('   ✅ Transparent background (optional)')
console.log('   ✅ High contrast for visibility')
console.log('   ✅ Simple design (recognizable at small sizes)')

console.log('\n🎯 Testing Your Icons:')
console.log('   1. Start development server: npm run dev')
console.log('   2. Check manifest: http://localhost:3000/manifest.json')
console.log('   3. Run PWA audit: npm run audit:pwa')
console.log('   4. Test installation on mobile device')

// Create a simple icon checklist
const checklistPath = path.join(iconsDir, 'ICON_CHECKLIST.md')
const checklist = `# PWA Icon Checklist

## Required Icons (Standard PWA)
${iconSizes.map(icon => `- [ ] icon-${icon.size}x${icon.size}.png (${icon.purpose})`).join('\n')}

## Apple Touch Icons
${appleIcons.map(icon => `- [ ] ${icon.name} (${icon.purpose})`).join('\n')}

## iOS Splash Screens (Optional)
${splashSizes.map(splash => `- [ ] ${splash.name} (${splash.device})`).join('\n')}

## Icon Guidelines
- [ ] PNG format
- [ ] Square aspect ratio
- [ ] Minimum 192x192 for PWA
- [ ] Maximum 512x512 recommended
- [ ] Simple, recognizable design
- [ ] High contrast
- [ ] Transparent background (optional)

## Testing
- [ ] Icons appear in manifest.json
- [ ] PWA audit passes (npm run audit:pwa)
- [ ] Install prompt shows correct icon
- [ ] Home screen icon looks good
- [ ] Splash screen displays correctly (iOS)

## Tools Used
- [ ] Online generator (realfavicongenerator.net)
- [ ] Design tool (Figma/Photoshop)
- [ ] Command line (ImageMagick)
- [ ] Manual creation

## Notes
Add any notes about your icon creation process here.
`

fs.writeFileSync(checklistPath, checklist)
console.log(`\n📝 Created icon checklist: ${checklistPath}`)

console.log('\n🎉 Icon setup complete!')
console.log('   📁 Icons directory: public/icons/')
console.log('   📝 Checklist: public/icons/ICON_CHECKLIST.md')
console.log('   🎨 Template: public/icons/icon-template.svg (if created)')

console.log('\n🚀 Next Steps:')
console.log('   1. Create your icons using one of the methods above')
console.log('   2. Place them in public/icons/')
console.log('   3. Run: npm run audit:pwa')
console.log('   4. Test PWA installation on mobile device')