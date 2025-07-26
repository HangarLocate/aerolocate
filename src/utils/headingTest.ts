import { aircraftIconCache } from '@/lib/iconCache';

// Test utility to verify aircraft icon headings
export interface HeadingTestResult {
  heading: number;
  expectedDirection: string;
  iconRotation: number;
  correct: boolean;
}

export function testAircraftHeadings(): HeadingTestResult[] {
  const testCases = [
    { heading: 0, expectedDirection: 'North (↑)' },
    { heading: 45, expectedDirection: 'Northeast (↗)' },
    { heading: 90, expectedDirection: 'East (→)' },
    { heading: 135, expectedDirection: 'Southeast (↘)' },
    { heading: 180, expectedDirection: 'South (↓)' },
    { heading: 225, expectedDirection: 'Southwest (↙)' },
    { heading: 270, expectedDirection: 'West (←)' },
    { heading: 315, expectedDirection: 'Northwest (↖)' },
  ];

  console.log('🧭 Testing Aircraft Icon Headings:');
  console.log('=====================================');

  return testCases.map(test => {
    // Get icon from cache (this will create it with correct rotation)
    const icon = aircraftIconCache.getIcon(test.heading, false);
    
    // Extract rotation from the icon's HTML (parse SVG transform)
    const iconHtml = icon.options.iconUrl as string;
    const decodedSvg = atob(iconHtml.split(',')[1]);
    const rotationMatch = decodedSvg.match(/rotate\(([^)]+)\s/);
    const actualRotation = rotationMatch ? parseFloat(rotationMatch[1]) : 0;

    // Check if rotation matches expected heading
    const correct = Math.abs(actualRotation - test.heading) < 1; // Allow 1° tolerance

    console.log(`${test.heading}° → ${test.expectedDirection}: Rotation ${actualRotation}° ${correct ? '✅' : '❌'}`);

    return {
      heading: test.heading,
      expectedDirection: test.expectedDirection,
      iconRotation: actualRotation,
      correct
    };
  });
}

// Helper to clear cache and test fresh icons
export function testHeadingsWithFreshCache(): HeadingTestResult[] {
  console.log('🔄 Clearing cache and testing with fresh icons...');
  aircraftIconCache.refreshCache();
  return testAircraftHeadings();
}

// Visual compass test for browser console
export function visualCompassTest(): void {
  console.log('🧭 Visual Compass Test:');
  console.log('   0°↑N    ');
  console.log('315°↖ ↗45°');
  console.log('270°← + →90°');
  console.log('225°↙ ↘135°');
  console.log('  180°↓S   '); 
  
  const results = testHeadingsWithFreshCache();
  const allCorrect = results.every(r => r.correct);
  
  console.log(`\n📊 Test Summary: ${allCorrect ? '✅ ALL CORRECT' : '❌ ISSUES FOUND'}`);
  
  if (!allCorrect) {
    console.log('❌ Failed tests:');
    results.filter(r => !r.correct).forEach(r => {
      console.log(`  ${r.heading}° expected ${r.expectedDirection}, got rotation ${r.iconRotation}°`);
    });
  }
}