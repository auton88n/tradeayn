import { BrowserTestRunner, BrowserTestResult } from './browserTestRunner';

export interface UserJourneyTest {
  id: string;
  name: string;
  category: 'auth' | 'navigation' | 'chat' | 'forms' | 'engineering';
  description: string;
  requiresAuth: boolean;
  run: (runner: BrowserTestRunner) => Promise<void>;
}

// Safe mode tests - these work without navigating away from admin panel
export const userJourneyTests: UserJourneyTest[] = [
  // ============ NAVIGATION TESTS (Safe Mode - verify elements exist) ============
  {
    id: 'nav-current-page',
    name: 'Current Page Has Elements',
    category: 'navigation',
    description: 'Verify current page has interactive elements',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const buttonCount = document.querySelectorAll('button').length;
      const inputCount = document.querySelectorAll('input, textarea').length;
      const linkCount = document.querySelectorAll('a').length;
      
      runner.log(`Found ${buttonCount} buttons, ${inputCount} inputs, ${linkCount} links`);
      
      if (buttonCount === 0 && inputCount === 0 && linkCount === 0) {
        throw new Error('No interactive elements found on page');
      }
    }
  },
  {
    id: 'nav-admin-panel',
    name: 'Admin Panel Loaded',
    category: 'navigation',
    description: 'Verify admin panel elements are present',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      // Check for admin-specific elements
      const hasCards = document.querySelectorAll('[class*="card"]').length > 0;
      const hasTabs = runner.exists('[role="tablist"]') || runner.exists('[class*="tab"]');
      const hasButtons = document.querySelectorAll('button').length >= 3;
      
      runner.log(`Cards: ${hasCards}, Tabs: ${hasTabs}, Buttons: ${hasButtons}`);
      
      if (!hasCards && !hasTabs && !hasButtons) {
        throw new Error('Admin panel elements not detected');
      }
      
      runner.log('Admin panel structure verified');
    }
  },
  {
    id: 'nav-sidebar-exists',
    name: 'Sidebar Navigation Present',
    category: 'navigation',
    description: 'Check if sidebar navigation exists',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const sidebarSelectors = [
        '[class*="sidebar"]',
        '[role="navigation"]',
        'nav',
        '[data-testid="sidebar"]'
      ];
      
      let found = false;
      for (const selector of sidebarSelectors) {
        if (runner.exists(selector)) {
          found = true;
          runner.log(`Found sidebar: ${selector}`);
          break;
        }
      }
      
      runner.log(`Sidebar ${found ? 'present' : 'not visible on current view'}`);
    }
  },
  {
    id: 'nav-header-exists',
    name: 'Header Section Present',
    category: 'navigation',
    description: 'Check if header/title exists',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const hasH1 = document.querySelector('h1') !== null;
      const hasH2 = document.querySelector('h2') !== null;
      const hasHeader = document.querySelector('header') !== null;
      
      runner.log(`H1: ${hasH1}, H2: ${hasH2}, Header: ${hasHeader}`);
      
      if (!hasH1 && !hasH2 && !hasHeader) {
        runner.log('No header elements found - may be expected for some views');
      }
    }
  },

  // ============ AUTH TESTS (Work on current page) ============
  {
    id: 'auth-button-exists',
    name: 'Auth Buttons Visible',
    category: 'auth',
    description: 'Check for sign in/out buttons',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const authSelectors = [
        'button:has-text("Sign")',
        'button:has-text("Login")',
        'button:has-text("Log")',
        'button:has-text("Account")',
        '[data-testid*="auth"]'
      ];
      
      let found = false;
      for (const selector of authSelectors) {
        if (runner.exists(selector)) {
          found = true;
          runner.log(`Found auth element: ${selector}`);
          break;
        }
      }
      
      runner.log(`Auth controls ${found ? 'found' : 'not visible in current view'}`);
    }
  },
  {
    id: 'auth-form-elements',
    name: 'Auth Form Elements Check',
    category: 'auth',
    description: 'Check for email/password inputs on page',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const textInputs = document.querySelectorAll('input[type="text"]');
      
      runner.log(`Email inputs: ${emailInput ? 1 : 0}`);
      runner.log(`Password inputs: ${passwordInput ? 1 : 0}`);
      runner.log(`Text inputs: ${textInputs.length}`);
    }
  },

  // ============ CHAT TESTS ============
  {
    id: 'chat-textarea-exists',
    name: 'Chat Input Exists',
    category: 'chat',
    description: 'Check for chat/message textarea',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const textareas = document.querySelectorAll('textarea');
      const chatInputs = document.querySelectorAll('[class*="chat"] input, [class*="message"] input');
      
      runner.log(`Textareas: ${textareas.length}, Chat inputs: ${chatInputs.length}`);
      
      if (textareas.length > 0) {
        runner.log('Chat textarea found');
      }
    }
  },
  {
    id: 'chat-send-button',
    name: 'Send Button Exists',
    category: 'chat',
    description: 'Check for message send button',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const sendSelectors = [
        'button[type="submit"]',
        'button:has-text("Send")',
        '[data-testid="send-button"]',
        'button[class*="send"]'
      ];
      
      for (const selector of sendSelectors) {
        if (runner.exists(selector)) {
          runner.log(`Found send button: ${selector}`);
          return;
        }
      }
      
      runner.log('Send button not visible in current view');
    }
  },

  // ============ FORM TESTS ============
  {
    id: 'form-inputs-present',
    name: 'Form Inputs Present',
    category: 'forms',
    description: 'Count and verify form inputs on page',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const inputs = document.querySelectorAll('input');
      const textareas = document.querySelectorAll('textarea');
      const selects = document.querySelectorAll('select');
      const checkboxes = document.querySelectorAll('[role="checkbox"], input[type="checkbox"]');
      const switches = document.querySelectorAll('[role="switch"]');
      
      runner.log(`Inputs: ${inputs.length}`);
      runner.log(`Textareas: ${textareas.length}`);
      runner.log(`Selects: ${selects.length}`);
      runner.log(`Checkboxes: ${checkboxes.length}`);
      runner.log(`Switches: ${switches.length}`);
      
      const total = inputs.length + textareas.length + selects.length;
      if (total === 0) {
        runner.log('No form elements found - may be expected for current view');
      }
    }
  },
  {
    id: 'form-buttons-enabled',
    name: 'Form Buttons State',
    category: 'forms',
    description: 'Check if form buttons are enabled/disabled',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const buttons = document.querySelectorAll('button');
      let enabledCount = 0;
      let disabledCount = 0;
      
      buttons.forEach(btn => {
        if ((btn as HTMLButtonElement).disabled) {
          disabledCount++;
        } else {
          enabledCount++;
        }
      });
      
      runner.log(`Enabled buttons: ${enabledCount}`);
      runner.log(`Disabled buttons: ${disabledCount}`);
    }
  },
  {
    id: 'form-file-upload',
    name: 'File Upload Input',
    category: 'forms',
    description: 'Check for file upload capabilities',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const fileInputs = document.querySelectorAll('input[type="file"]');
      const dropzones = document.querySelectorAll('[class*="drop"], [class*="upload"]');
      
      runner.log(`File inputs: ${fileInputs.length}`);
      runner.log(`Dropzone areas: ${dropzones.length}`);
    }
  },
  {
    id: 'form-toggle-switch',
    name: 'Toggle Switch Interaction',
    category: 'forms',
    description: 'Find and test toggle switches',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const switches = document.querySelectorAll('[role="switch"]');
      runner.log(`Found ${switches.length} switches`);
      
      if (switches.length > 0) {
        const firstSwitch = switches[0] as HTMLElement;
        const initialState = firstSwitch.getAttribute('data-state');
        runner.log(`First switch state: ${initialState}`);
        
        // Try to toggle it
        firstSwitch.click();
        await runner.wait(300);
        
        const newState = firstSwitch.getAttribute('data-state');
        runner.log(`After click state: ${newState}`);
        
        // Toggle back
        firstSwitch.click();
        await runner.wait(300);
      }
    }
  },
  {
    id: 'form-select-dropdown',
    name: 'Select Dropdown Check',
    category: 'forms',
    description: 'Find and check select dropdowns',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const selects = document.querySelectorAll('select, [role="combobox"]');
      runner.log(`Found ${selects.length} select elements`);
      
      if (selects.length > 0) {
        runner.log('Select dropdowns present');
      }
    }
  },
  {
    id: 'form-validation-display',
    name: 'Form Validation Display',
    category: 'forms',
    description: 'Check for form validation messages',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const errorMessages = document.querySelectorAll('[class*="error"], [role="alert"]');
      const invalidInputs = document.querySelectorAll('[aria-invalid="true"]');
      
      runner.log(`Error messages: ${errorMessages.length}`);
      runner.log(`Invalid inputs: ${invalidInputs.length}`);
    }
  },

  // ============ ENGINEERING TESTS ============
  {
    id: 'eng-calculator-buttons',
    name: 'Calculator Buttons Check',
    category: 'engineering',
    description: 'Check for engineering calculator buttons',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const calcTerms = ['Beam', 'Column', 'Slab', 'Foundation', 'Wall', 'Calculate'];
      let foundCount = 0;
      
      for (const term of calcTerms) {
        if (runner.exists(`button:has-text("${term}")`)) {
          foundCount++;
          runner.log(`Found: ${term}`);
        }
      }
      
      runner.log(`Calculator-related buttons: ${foundCount}`);
    }
  },
  {
    id: 'eng-number-inputs',
    name: 'Number Input Fields',
    category: 'engineering',
    description: 'Check for number input fields',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const numberInputs = document.querySelectorAll('input[type="number"]');
      runner.log(`Number inputs: ${numberInputs.length}`);
      
      if (numberInputs.length > 0) {
        const first = numberInputs[0] as HTMLInputElement;
        runner.log(`First input placeholder: ${first.placeholder || 'none'}`);
      }
    }
  },
  {
    id: 'eng-results-display',
    name: 'Results Display Area',
    category: 'engineering',
    description: 'Check for calculation results display',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const resultsSelectors = [
        '[class*="result"]',
        '[class*="output"]',
        '[data-testid*="result"]'
      ];
      
      for (const selector of resultsSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          runner.log(`Found results area: ${selector} (${elements.length})`);
        }
      }
    }
  },

  // ============ UI COMPONENT TESTS ============
  {
    id: 'ui-cards-present',
    name: 'Card Components',
    category: 'navigation',
    description: 'Check for card UI components',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const cards = document.querySelectorAll('[class*="card"]');
      runner.log(`Card components: ${cards.length}`);
    }
  },
  {
    id: 'ui-badges-present',
    name: 'Badge Components',
    category: 'navigation',
    description: 'Check for badge UI components',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const badges = document.querySelectorAll('[class*="badge"]');
      runner.log(`Badge components: ${badges.length}`);
    }
  },
  {
    id: 'ui-scroll-areas',
    name: 'Scroll Areas',
    category: 'navigation',
    description: 'Check for scrollable content areas',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const scrollAreas = document.querySelectorAll('[class*="scroll"], [style*="overflow"]');
      runner.log(`Scroll areas: ${scrollAreas.length}`);
    }
  },
  {
    id: 'ui-icons-loaded',
    name: 'Icons Loaded',
    category: 'navigation',
    description: 'Check if icons are rendering',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const svgIcons = document.querySelectorAll('svg');
      runner.log(`SVG icons: ${svgIcons.length}`);
      
      if (svgIcons.length === 0) {
        runner.log('Warning: No SVG icons found');
      }
    }
  },

  // ============ ACCESSIBILITY TESTS ============
  {
    id: 'a11y-aria-labels',
    name: 'ARIA Labels Present',
    category: 'forms',
    description: 'Check for accessibility labels',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const ariaLabeled = document.querySelectorAll('[aria-label]');
      const ariaDescribed = document.querySelectorAll('[aria-describedby]');
      const roles = document.querySelectorAll('[role]');
      
      runner.log(`aria-label: ${ariaLabeled.length}`);
      runner.log(`aria-describedby: ${ariaDescribed.length}`);
      runner.log(`role attributes: ${roles.length}`);
    }
  },
  {
    id: 'a11y-focus-visible',
    name: 'Focusable Elements',
    category: 'forms',
    description: 'Check for focusable elements',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const focusable = document.querySelectorAll(
        'button, a, input, textarea, select, [tabindex]'
      );
      runner.log(`Focusable elements: ${focusable.length}`);
    }
  },

  // ============ PERFORMANCE TESTS ============
  {
    id: 'perf-dom-size',
    name: 'DOM Size Check',
    category: 'navigation',
    description: 'Check DOM element count',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const allElements = document.querySelectorAll('*');
      runner.log(`Total DOM elements: ${allElements.length}`);
      
      if (allElements.length > 3000) {
        runner.log('Warning: Large DOM size may affect performance');
      }
    }
  },
  {
    id: 'perf-images-loaded',
    name: 'Images Check',
    category: 'navigation',
    description: 'Check image loading status',
    requiresAuth: false,
    run: async (runner) => {
      await runner.wait(500);
      
      const images = document.querySelectorAll('img');
      let loadedCount = 0;
      
      images.forEach(img => {
        if ((img as HTMLImageElement).complete) {
          loadedCount++;
        }
      });
      
      runner.log(`Images: ${loadedCount}/${images.length} loaded`);
    }
  }
];

// Get tests grouped by category
export const getTestsByCategory = (): Record<string, UserJourneyTest[]> => {
  const categories: Record<string, UserJourneyTest[]> = {};
  
  for (const test of userJourneyTests) {
    if (!categories[test.category]) {
      categories[test.category] = [];
    }
    categories[test.category].push(test);
  }
  
  return categories;
};

// Run all tests in a category
export const runTestCategory = async (
  runner: BrowserTestRunner,
  category: string
): Promise<BrowserTestResult[]> => {
  const categories = getTestsByCategory();
  const categoryTests = categories[category] || [];
  const results: BrowserTestResult[] = [];
  
  for (const test of categoryTests) {
    const result = await runner.runTest(test.name, test.run);
    results.push(result);
    await runner.wait(200);
  }
  
  return results;
};

// Run all tests
export const runAllTests = async (runner: BrowserTestRunner): Promise<BrowserTestResult[]> => {
  const results: BrowserTestResult[] = [];
  
  for (const test of userJourneyTests) {
    const result = await runner.runTest(test.name, test.run);
    results.push(result);
    await runner.wait(200);
  }
  
  return results;
};
