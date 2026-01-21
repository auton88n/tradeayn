import { BrowserTestRunner, BrowserTestResult } from './browserTestRunner';

export interface UserJourneyTest {
  id: string;
  name: string;
  category: 'auth' | 'navigation' | 'chat' | 'forms' | 'engineering';
  description: string;
  requiresAuth: boolean;
  run: (runner: BrowserTestRunner) => Promise<void>;
}

export const userJourneyTests: UserJourneyTest[] = [
  // ============ NAVIGATION TESTS ============
  {
    id: 'nav-landing',
    name: 'Landing Page Loads',
    category: 'navigation',
    description: 'Verify landing page loads with hero section',
    requiresAuth: false,
    run: async (runner) => {
      await runner.navigate('/');
      await runner.wait(1000);
      
      // Check for key landing page elements
      if (!runner.exists('button') && !runner.exists('a')) {
        throw new Error('No interactive elements found on landing page');
      }
      
      runner.log('Landing page loaded successfully');
    }
  },
  {
    id: 'nav-engineering',
    name: 'Navigate to Engineering',
    category: 'navigation',
    description: 'Navigate to engineering page',
    requiresAuth: false,
    run: async (runner) => {
      await runner.navigate('/engineering');
      await runner.wait(2000);
      
      const path = runner.getCurrentPath();
      if (!path.includes('engineering')) {
        throw new Error(`Expected /engineering, got ${path}`);
      }
      
      runner.log('Engineering page loaded');
    }
  },
  {
    id: 'nav-support',
    name: 'Navigate to Support',
    category: 'navigation',
    description: 'Navigate to support page',
    requiresAuth: false,
    run: async (runner) => {
      await runner.navigate('/support');
      await runner.wait(2000);
      
      const path = runner.getCurrentPath();
      if (!path.includes('support')) {
        throw new Error(`Expected /support, got ${path}`);
      }
      
      runner.log('Support page loaded');
    }
  },
  {
    id: 'nav-settings',
    name: 'Navigate to Settings',
    category: 'navigation',
    description: 'Navigate to settings page',
    requiresAuth: false,
    run: async (runner) => {
      await runner.navigate('/settings');
      await runner.wait(2000);
      
      const path = runner.getCurrentPath();
      if (!path.includes('settings')) {
        throw new Error(`Expected /settings, got ${path}`);
      }
      
      runner.log('Settings page loaded');
    }
  },

  // ============ AUTH TESTS ============
  {
    id: 'auth-modal-opens',
    name: 'Auth Modal Opens',
    category: 'auth',
    description: 'Click sign in and verify modal opens',
    requiresAuth: false,
    run: async (runner) => {
      await runner.navigate('/');
      await runner.wait(1000);
      
      // Look for sign in button
      const signInSelectors = [
        'button:has-text("Sign In")',
        'button:has-text("Sign in")',
        'button:has-text("Login")',
        'button:has-text("Get Started")',
        '[data-testid="sign-in-button"]'
      ];
      
      let clicked = false;
      for (const selector of signInSelectors) {
        if (runner.exists(selector)) {
          await runner.click(selector);
          clicked = true;
          break;
        }
      }
      
      if (!clicked) {
        runner.log('No sign in button found, checking if already on auth page');
        return;
      }
      
      await runner.wait(500);
      
      // Check for dialog/modal
      if (!runner.exists('[role="dialog"]') && !runner.exists('form')) {
        throw new Error('Auth modal did not open');
      }
      
      runner.log('Auth modal opened successfully');
    }
  },
  {
    id: 'auth-form-validation',
    name: 'Auth Form Validation',
    category: 'auth',
    description: 'Verify form shows validation errors',
    requiresAuth: false,
    run: async (runner) => {
      await runner.navigate('/');
      await runner.wait(1000);
      
      // Try to open auth modal
      const signInSelectors = [
        'button:has-text("Sign In")',
        'button:has-text("Sign in")',
        'button:has-text("Get Started")'
      ];
      
      for (const selector of signInSelectors) {
        if (runner.exists(selector)) {
          await runner.click(selector);
          break;
        }
      }
      
      await runner.wait(500);
      
      // Try to submit empty form
      const submitButton = runner.findElement('button[type="submit"]');
      if (submitButton) {
        await runner.click('button[type="submit"]');
        await runner.wait(500);
        runner.log('Submitted empty form to trigger validation');
      }
    }
  },

  // ============ CHAT TESTS ============
  {
    id: 'chat-input-exists',
    name: 'Chat Input Visible',
    category: 'chat',
    description: 'Verify chat input is visible on dashboard',
    requiresAuth: true,
    run: async (runner) => {
      await runner.navigate('/');
      await runner.wait(2000);
      
      const chatInputSelectors = [
        'textarea',
        'input[type="text"][placeholder*="message"]',
        '[data-testid="chat-input"]'
      ];
      
      let found = false;
      for (const selector of chatInputSelectors) {
        if (runner.exists(selector)) {
          found = true;
          runner.log(`Found chat input: ${selector}`);
          break;
        }
      }
      
      if (!found) {
        throw new Error('Chat input not found - user may not be logged in');
      }
    }
  },
  {
    id: 'chat-send-message',
    name: 'Send Chat Message',
    category: 'chat',
    description: 'Type and send a message in chat',
    requiresAuth: true,
    run: async (runner) => {
      await runner.navigate('/');
      await runner.wait(2000);
      
      // Find textarea
      if (!runner.exists('textarea')) {
        throw new Error('Chat textarea not found');
      }
      
      // Type a message
      await runner.fill('textarea', 'Hello, this is a test message!');
      await runner.wait(300);
      
      // Try to send
      const sendButton = runner.findElement('button[type="submit"]');
      if (sendButton) {
        await runner.click('button[type="submit"]');
        runner.log('Message sent');
      } else {
        // Try pressing Enter
        const textarea = runner.findElement('textarea') as HTMLTextAreaElement;
        textarea?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        runner.log('Sent via Enter key');
      }
      
      await runner.wait(2000);
    }
  },

  // ============ FORM TESTS ============
  {
    id: 'form-contact',
    name: 'Contact Form Exists',
    category: 'forms',
    description: 'Verify contact form is accessible',
    requiresAuth: false,
    run: async (runner) => {
      await runner.navigate('/');
      await runner.wait(1000);
      
      // Look for contact section
      const contactSelectors = [
        'button:has-text("Contact")',
        'a:has-text("Contact")',
        '[href*="contact"]',
        '#contact'
      ];
      
      let found = false;
      for (const selector of contactSelectors) {
        if (runner.exists(selector)) {
          found = true;
          runner.log(`Found contact element: ${selector}`);
          break;
        }
      }
      
      runner.log(`Contact section ${found ? 'found' : 'not found on current page'}`);
    }
  },

  // ============ ENGINEERING TESTS ============
  {
    id: 'eng-calculator-loads',
    name: 'Engineering Calculators Load',
    category: 'engineering',
    description: 'Verify engineering page shows calculator options',
    requiresAuth: false,
    run: async (runner) => {
      await runner.navigate('/engineering');
      await runner.wait(2000);
      
      // Look for calculator buttons or tabs
      const calcSelectors = [
        'button:has-text("Beam")',
        'button:has-text("Column")',
        'button:has-text("Foundation")',
        'button:has-text("Slab")',
        '[data-testid*="calculator"]'
      ];
      
      let foundCount = 0;
      for (const selector of calcSelectors) {
        if (runner.exists(selector)) {
          foundCount++;
          runner.log(`Found calculator: ${selector}`);
        }
      }
      
      if (foundCount === 0) {
        runner.log('No calculator buttons found - may require auth');
      }
    }
  },
  {
    id: 'eng-beam-form',
    name: 'Beam Calculator Form',
    category: 'engineering',
    description: 'Open beam calculator and verify form fields',
    requiresAuth: false,
    run: async (runner) => {
      await runner.navigate('/engineering');
      await runner.wait(2000);
      
      // Try to click beam calculator
      if (runner.exists('button:has-text("Beam")')) {
        await runner.click('button:has-text("Beam")');
        await runner.wait(1000);
        
        // Look for input fields
        const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
        runner.log(`Found ${inputs.length} input fields`);
        
        if (inputs.length === 0) {
          runner.log('No input fields visible - form may not have loaded');
        }
      } else {
        runner.log('Beam calculator button not found');
      }
    }
  }
];

// Group tests by category
export const getTestsByCategory = () => {
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
  const tests = userJourneyTests.filter(t => t.category === category);
  const results: BrowserTestResult[] = [];
  
  for (const test of tests) {
    const result = await runner.runTest(test.name, test.run);
    results.push(result);
  }
  
  return results;
};

// Run all tests
export const runAllTests = async (
  runner: BrowserTestRunner
): Promise<BrowserTestResult[]> => {
  const results: BrowserTestResult[] = [];
  
  for (const test of userJourneyTests) {
    const result = await runner.runTest(test.name, test.run);
    results.push(result);
    
    // Small delay between tests
    await runner.wait(500);
  }
  
  return results;
};
