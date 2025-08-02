#!/usr/bin/env node

// Integration test for template functions system
// Validates that templates generate consistent HTML

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { templates } from '../src/shared/templates.js';
import { sampleData } from '../src/shared/data.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runTests() {
  console.log('🧪 Testing Template Functions System\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Template function exists and is callable
  totalTests++;
  console.log('Test 1: Template function exists...');
  try {
    if (typeof templates.filtersCard === 'function') {
      console.log('✅ PASS: filtersCard template function exists');
      passedTests++;
    } else {
      console.log('❌ FAIL: filtersCard template function missing');
    }
  } catch (error) {
    console.log('❌ FAIL: Error checking template function:', error.message);
  }
  
  // Test 2: Template generates valid HTML
  totalTests++;
  console.log('\nTest 2: Template generates HTML...');
  try {
    const html = templates.filtersCard(sampleData);
    if (html && html.includes('card filter-section') && html.includes('collection-list')) {
      console.log('✅ PASS: Template generates valid HTML structure');
      passedTests++;
    } else {
      console.log('❌ FAIL: Template HTML missing expected elements');
    }
  } catch (error) {
    console.log('❌ FAIL: Error generating HTML:', error.message);
  }
  
  // Test 3: Generated component file exists
  totalTests++;
  console.log('\nTest 3: Static component file exists...');
  try {
    const componentPath = path.join(__dirname, '..', 'src', 'components', '_filters-card.html');
    if (fs.existsSync(componentPath)) {
      console.log('✅ PASS: Static component file exists');
      passedTests++;
    } else {
      console.log('❌ FAIL: Static component file not found');
    }
  } catch (error) {
    console.log('❌ FAIL: Error checking component file:', error.message);
  }
  
  // Test 4: Template bundle exists
  totalTests++;
  console.log('\nTest 4: Template bundle exists...');
  try {
    const bundlePath = path.join(__dirname, '..', 'temp', 'templates-bundle.js');
    if (fs.existsSync(bundlePath)) {
      const bundleCode = fs.readFileSync(bundlePath, 'utf8');
      if (bundleCode.includes('window.templates') && bundleCode.includes('filtersCard')) {
        console.log('✅ PASS: Template bundle exists and contains templates');
        passedTests++;
      } else {
        console.log('❌ FAIL: Template bundle missing expected content');
      }
    } else {
      console.log('❌ FAIL: Template bundle file not found');
    }
  } catch (error) {
    console.log('❌ FAIL: Error checking bundle file:', error.message);
  }
  
  // Test 5: HTML consistency between template and static component
  totalTests++;
  console.log('\nTest 5: HTML consistency check...');
  try {
    const dynamicHTML = templates.filtersCard(sampleData);
    const componentPath = path.join(__dirname, '..', 'src', 'components', '_filters-card.html');
    const staticFile = fs.readFileSync(componentPath, 'utf8');
    
    // Remove auto-generation comments from static file
    const staticHTML = staticFile
      .replace(/<!-- Auto-generated[^>]*-->/g, '')
      .replace(/<!-- Component:[^>]*-->/g, '')
      .replace(/<!-- DO NOT EDIT:[^>]*-->/g, '')
      .trim();
    
    if (dynamicHTML.trim() === staticHTML.trim()) {
      console.log('✅ PASS: Dynamic and static HTML are identical');
      passedTests++;
    } else {
      console.log('❌ FAIL: Dynamic and static HTML differ');
      console.log('Dynamic length:', dynamicHTML.length);
      console.log('Static length:', staticHTML.length);
    }
  } catch (error) {
    console.log('❌ FAIL: Error comparing HTML:', error.message);
  }
  
  // Test 6: Template works with different data
  totalTests++;
  console.log('\nTest 6: Template works with different data...');
  try {
    const customData = {
      collections: [
        {
          name: 'Test Collection',
          selected: true,
          badges: [{ color: 'cyan', icon: 'palette', count: 5 }],
          total: 5
        }
      ]
    };
    
    const customHTML = templates.filtersCard(customData);
    if (customHTML.includes('Test Collection') && customHTML.includes('5 tokens')) {
      console.log('✅ PASS: Template works with custom data');
      passedTests++;
    } else {
      console.log('❌ FAIL: Template not using custom data correctly');
    }
  } catch (error) {
    console.log('❌ FAIL: Error with custom data:', error.message);
  }
  
  // Results
  console.log('\n' + '='.repeat(50));
  console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Template system is working correctly.');
    console.log('\n✅ Ready for integration into the main build system');
    process.exit(0);
  } else {
    console.log(`❌ ${totalTests - passedTests} test(s) failed. Please fix issues before proceeding.`);
    process.exit(1);
  }
}

// Run the tests
runTests();
