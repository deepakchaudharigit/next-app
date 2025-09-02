#!/bin/bash
# Convert SVG icons to PNG using ImageMagick
# Run this if you have ImageMagick installed

cd public/icons

for size in 72 96 128 144 152 192 384 512; do
  if command -v convert &> /dev/null; then
    convert "icon-${size}x${size}.svg" "icon-${size}x${size}.png"
    echo "Converted icon-${size}x${size}.png"
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
