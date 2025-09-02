'use client';

/**
 * Performance Optimizer Component
 * Handles client-side performance optimizations and monitoring
 */

import { useEffect } from 'react';

interface PerformanceOptimizerProps {
  enableMonitoring?: boolean;
  enableOptimizations?: boolean;
}

export function PerformanceOptimizer({ 
  enableMonitoring = true, 
  enableOptimizations = true 
}: PerformanceOptimizerProps) {
  
  useEffect(() => {
    if (!enableOptimizations) return;

    // 1. Preload critical resources
    const preloadCriticalResources = () => {
      const criticalResources = [
        '/icons/favicon.svg',
        '/manifest.json'
      ];

      criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = resource.endsWith('.svg') ? 'image' : 'fetch';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });
    };

    // 2. Optimize images loading
    const optimizeImages = () => {
      const images = document.querySelectorAll('img[data-src]');
      
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              img.src = img.dataset.src || '';
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          });
        });

        images.forEach(img => imageObserver.observe(img));
      }
    };

    // 3. Reduce layout shifts
    const preventLayoutShifts = () => {
      // Add aspect ratio containers for images
      const images = document.querySelectorAll('img:not([width]):not([height])');
      images.forEach(img => {
        const imageElement = img as HTMLImageElement;
        if (imageElement.naturalWidth && imageElement.naturalHeight) {
          const aspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
          if (aspectRatio) {
            imageElement.style.aspectRatio = aspectRatio.toString();
          }
        }
      });
    };

    // 4. Optimize font loading
    const optimizeFonts = () => {
      if ('fonts' in document) {
        // Preload critical fonts
        const fontFaces = [
          new FontFace('Inter', 'url(/fonts/inter-var.woff2)', {
            display: 'swap',
            weight: '100 900'
          })
        ];

        fontFaces.forEach(fontFace => {
          fontFace.load().then(loadedFont => {
            document.fonts.add(loadedFont);
          }).catch(error => {
            console.warn('Font loading failed:', error);
          });
        });
      }
    };

    // 5. Service Worker registration
    const registerServiceWorker = () => {
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registered:', registration);
          })
          .catch(error => {
            console.log('SW registration failed:', error);
          });
      }
    };

    // Run optimizations
    preloadCriticalResources();
    optimizeImages();
    preventLayoutShifts();
    optimizeFonts();
    registerServiceWorker();

  }, [enableOptimizations]);

  useEffect(() => {
    if (!enableMonitoring) return;

    // Performance monitoring
    const monitorPerformance = () => {
      // Monitor Core Web Vitals
      if ('web-vitals' in window) {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS(metric => console.log('CLS:', metric));
          getFID(metric => console.log('FID:', metric));
          getFCP(metric => console.log('FCP:', metric));
          getLCP(metric => console.log('LCP:', metric));
          getTTFB(metric => console.log('TTFB:', metric));
        });
      }

      // Monitor long tasks
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 50) {
                console.warn(`Long task detected: ${entry.duration}ms`);
              }
            }
          });
          observer.observe({ entryTypes: ['longtask'] });
        } catch (error) {
          console.warn('Performance observer not supported:', error);
        }
      }

      // Monitor resource loading
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const resources = performance.getEntriesByType('resource');

        console.log('Navigation timing:', {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart
        });

        // Log slow resources
        resources.forEach(resource => {
          if (resource.duration > 1000) {
            console.warn(`Slow resource: ${resource.name} took ${resource.duration}ms`);
          }
        });
      });
    };

    monitorPerformance();
  }, [enableMonitoring]);

  // This component doesn't render anything
  return null;
}

export default PerformanceOptimizer;