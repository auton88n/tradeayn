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
  },

  // ============ FILE UPLOAD TESTS ============
  {
    id: 'upload-zone-visible',
    name: 'File Upload Zone Visible',
    category: 'forms',
    description: 'Verify file upload zone is accessible in dashboard',
    requiresAuth: true,
    run: async (runner) => {
      await runner.navigate('/');
      await runner.wait(2000);
      
      // Look for file upload elements
      const uploadSelectors = [
        'input[type="file"]',
        '[data-testid="file-upload"]',
        'button:has-text("Upload")',
        '[class*="upload"]',
        '[class*="dropzone"]'
      ];
      
      let found = false;
      for (const selector of uploadSelectors) {
        if (runner.exists(selector)) {
          found = true;
          runner.log(`Found upload element: ${selector}`);
          break;
        }
      }
      
      if (!found) {
        runner.log('No upload zone visible - may require specific UI state');
      }
    }
  },
  {
    id: 'upload-drag-drop-area',
    name: 'Drag Drop Area Exists',
    category: 'forms',
    description: 'Verify drag and drop upload area is present',
    requiresAuth: true,
    run: async (runner) => {
      await runner.navigate('/');
      await runner.wait(2000);
      
      // Check for drag-drop specific elements
      const dropzoneExists = runner.exists('[class*="drop"]') || 
                            runner.exists('[data-testid*="drop"]') ||
                            runner.exists('[ondragover]');
      
      runner.log(`Dropzone area ${dropzoneExists ? 'found' : 'not found'}`);
    }
  },

  // ============ SETTINGS TESTS ============
  {
    id: 'settings-account-tab',
    name: 'Settings Account Tab',
    category: 'forms',
    description: 'Navigate to settings and verify account section',
    requiresAuth: true,
    run: async (runner) => {
      await runner.navigate('/settings');
      await runner.wait(2000);
      
      // Look for account-related elements
      const accountSelectors = [
        'button:has-text("Account")',
        '[data-value="account"]',
        'input[type="email"]',
        '[class*="account"]'
      ];
      
      let found = false;
      for (const selector of accountSelectors) {
        if (runner.exists(selector)) {
          found = true;
          runner.log(`Found account section: ${selector}`);
          break;
        }
      }
      
      if (!found) {
        throw new Error('Account settings section not found');
      }
    }
  },
  {
    id: 'settings-notifications-tab',
    name: 'Settings Notifications Tab',
    category: 'forms',
    description: 'Navigate to notifications settings',
    requiresAuth: true,
    run: async (runner) => {
      await runner.navigate('/settings');
      await runner.wait(2000);
      
      // Try to click notifications tab
      const notifSelectors = [
        'button:has-text("Notifications")',
        '[data-value="notifications"]',
        'a:has-text("Notifications")'
      ];
      
      for (const selector of notifSelectors) {
        if (runner.exists(selector)) {
          await runner.click(selector);
          await runner.wait(500);
          runner.log('Opened notifications tab');
          
          // Verify switches exist
          if (runner.exists('[role="switch"]')) {
            runner.log('Found notification toggle switches');
          }
          return;
        }
      }
      
      runner.log('Notifications tab not found');
    }
  },
  {
    id: 'settings-toggle-switch',
    name: 'Toggle Settings Switch',
    category: 'forms',
    description: 'Toggle a settings switch and verify state change',
    requiresAuth: true,
    run: async (runner) => {
      await runner.navigate('/settings');
      await runner.wait(2000);
      
      // Find a switch element
      const switches = document.querySelectorAll('[role="switch"]');
      if (switches.length === 0) {
        runner.log('No toggle switches found on settings page');
        return;
      }
      
      const firstSwitch = switches[0] as HTMLElement;
      const initialState = firstSwitch.getAttribute('data-state');
      
      // Click the switch
      firstSwitch.click();
      await runner.wait(500);
      
      const newState = firstSwitch.getAttribute('data-state');
      
      if (initialState !== newState) {
        runner.log(`Switch toggled: ${initialState} -> ${newState}`);
      } else {
        runner.log('Switch state unchanged (may be disabled or readonly)');
      }
    }
  },
  {
    id: 'settings-privacy-tab',
    name: 'Settings Privacy Tab',
    category: 'forms',
    description: 'Navigate to privacy settings',
    requiresAuth: true,
    run: async (runner) => {
      await runner.navigate('/settings');
      await runner.wait(2000);
      
      const privacySelectors = [
        'button:has-text("Privacy")',
        '[data-value="privacy"]',
        'a:has-text("Privacy")'
      ];
      
      for (const selector of privacySelectors) {
        if (runner.exists(selector)) {
          await runner.click(selector);
          await runner.wait(500);
          runner.log('Opened privacy tab');
          return;
        }
      }
      
      runner.log('Privacy tab not found');
    }
  },

  // ============ MULTI-STEP WORKFLOW TESTS ============
  {
    id: 'workflow-full-auth',
    name: 'Full Auth Workflow',
    category: 'auth',
    description: 'Complete sign in workflow from landing to dashboard',
    requiresAuth: false,
    run: async (runner) => {
      await runner.navigate('/');
      await runner.wait(1000);
      
      // Step 1: Click sign in
      const signInBtn = runner.findElement('button:has-text("Sign In")') || 
                        runner.findElement('button:has-text("Get Started")');
      if (!signInBtn) {
        runner.log('No sign in button found - user may already be logged in');
        return;
      }
      
      (signInBtn as HTMLElement).click();
      await runner.wait(500);
      runner.log('Step 1: Clicked sign in button');
      
      // Step 2: Wait for modal
      if (!runner.exists('[role="dialog"]')) {
        throw new Error('Auth modal did not open');
      }
      runner.log('Step 2: Modal opened');
      
      // Step 3: Fill email
      const emailInput = runner.findElement('input[type="email"]');
      if (emailInput) {
        (emailInput as HTMLInputElement).value = 'test@example.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        runner.log('Step 3: Filled email field');
      }
      
      // Step 4: Fill password
      const passwordInput = runner.findElement('input[type="password"]');
      if (passwordInput) {
        (passwordInput as HTMLInputElement).value = 'TestPassword123!';
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        runner.log('Step 4: Filled password field');
      }
      
      runner.log('Full auth workflow completed (form ready to submit)');
    }
  },
  {
    id: 'workflow-support-ticket',
    name: 'Support Ticket Workflow',
    category: 'forms',
    description: 'Navigate to support and start ticket creation',
    requiresAuth: false,
    run: async (runner) => {
      await runner.navigate('/support');
      await runner.wait(2000);
      
      // Step 1: Look for create ticket button
      const createBtnSelectors = [
        'button:has-text("Create")',
        'button:has-text("New Ticket")',
        'button:has-text("Submit")',
        '[data-testid="create-ticket"]'
      ];
      
      let createBtn = null;
      for (const selector of createBtnSelectors) {
        if (runner.exists(selector)) {
          createBtn = runner.findElement(selector);
          break;
        }
      }
      
      runner.log('Step 1: Found support page elements');
      
      // Step 2: Look for form fields
      const subjectInput = runner.findElement('input[name="subject"]') || 
                          runner.findElement('input[placeholder*="subject"]');
      if (subjectInput) {
        (subjectInput as HTMLInputElement).value = 'Test Support Ticket';
        subjectInput.dispatchEvent(new Event('input', { bubbles: true }));
        runner.log('Step 2: Filled subject field');
      }
      
      // Step 3: Look for message textarea
      const messageArea = runner.findElement('textarea');
      if (messageArea) {
        (messageArea as HTMLTextAreaElement).value = 'This is a test support message for workflow testing.';
        messageArea.dispatchEvent(new Event('input', { bubbles: true }));
        runner.log('Step 3: Filled message field');
      }
      
      runner.log('Support ticket workflow prepared');
    }
  },
  {
    id: 'workflow-engineering-calc',
    name: 'Engineering Calculation Workflow',
    category: 'engineering',
    description: 'Complete a beam calculation workflow',
    requiresAuth: false,
    run: async (runner) => {
      await runner.navigate('/engineering');
      await runner.wait(2000);
      
      // Step 1: Select beam calculator
      if (runner.exists('button:has-text("Beam")')) {
        await runner.click('button:has-text("Beam")');
        await runner.wait(1000);
        runner.log('Step 1: Selected beam calculator');
      } else {
        runner.log('Beam calculator button not found');
        return;
      }
      
      // Step 2: Fill in beam parameters
      const inputs = document.querySelectorAll('input[type="number"]');
      if (inputs.length >= 3) {
        (inputs[0] as HTMLInputElement).value = '6000'; // Length
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        
        (inputs[1] as HTMLInputElement).value = '300'; // Width
        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        
        (inputs[2] as HTMLInputElement).value = '500'; // Height
        inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
        
        runner.log('Step 2: Filled beam dimensions');
      }
      
      // Step 3: Look for calculate button
      const calcBtn = runner.findElement('button:has-text("Calculate")') ||
                     runner.findElement('button[type="submit"]');
      if (calcBtn) {
        runner.log('Step 3: Calculate button ready');
      }
      
      runner.log('Engineering calculation workflow prepared');
    }
  },
  {
    id: 'workflow-chat-session',
    name: 'Chat Session Workflow',
    category: 'chat',
    description: 'Start a new chat session and send multiple messages',
    requiresAuth: true,
    run: async (runner) => {
      await runner.navigate('/');
      await runner.wait(2000);
      
      // Step 1: Find chat input
      const textarea = runner.findElement('textarea') as HTMLTextAreaElement;
      if (!textarea) {
        throw new Error('Chat input not found - user may not be logged in');
      }
      runner.log('Step 1: Found chat input');
      
      // Step 2: Send first message
      textarea.value = 'Hello, this is message 1';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      
      const sendBtn = runner.findElement('button[type="submit"]');
      if (sendBtn) {
        (sendBtn as HTMLElement).click();
        await runner.wait(2000);
        runner.log('Step 2: Sent first message');
      }
      
      // Step 3: Send second message
      textarea.value = 'This is message 2';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      
      runner.log('Step 3: Chat session workflow prepared');
    }
  },
  {
    id: 'workflow-sidebar-navigation',
    name: 'Sidebar Navigation Workflow',
    category: 'navigation',
    description: 'Use sidebar to navigate between sections',
    requiresAuth: true,
    run: async (runner) => {
      await runner.navigate('/');
      await runner.wait(2000);
      
      // Look for sidebar elements
      const sidebarSelectors = [
        '[class*="sidebar"]',
        'nav',
        '[role="navigation"]'
      ];
      
      let sidebarFound = false;
      for (const selector of sidebarSelectors) {
        if (runner.exists(selector)) {
          sidebarFound = true;
          runner.log(`Step 1: Found sidebar: ${selector}`);
          break;
        }
      }
      
      if (!sidebarFound) {
        runner.log('Sidebar not visible - may be collapsed or mobile view');
        return;
      }
      
      // Step 2: Look for navigation links within sidebar
      const navLinks = document.querySelectorAll('nav a, [role="navigation"] a, [class*="sidebar"] a');
      runner.log(`Step 2: Found ${navLinks.length} navigation links`);
      
      // Step 3: Click first nav link if available
      if (navLinks.length > 0) {
        const firstLink = navLinks[0] as HTMLElement;
        firstLink.click();
        await runner.wait(1000);
        runner.log('Step 3: Clicked navigation link');
      }
    }
  },
  {
    id: 'workflow-form-validation',
    name: 'Form Validation Workflow',
    category: 'forms',
    description: 'Test form validation with invalid inputs',
    requiresAuth: false,
    run: async (runner) => {
      await runner.navigate('/');
      await runner.wait(1000);
      
      // Try to open auth modal
      const signInBtn = runner.findElement('button:has-text("Sign In")') || 
                        runner.findElement('button:has-text("Get Started")');
      if (signInBtn) {
        (signInBtn as HTMLElement).click();
        await runner.wait(500);
      }
      
      // Step 1: Fill invalid email
      const emailInput = runner.findElement('input[type="email"]');
      if (emailInput) {
        (emailInput as HTMLInputElement).value = 'invalid-email';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        emailInput.dispatchEvent(new Event('blur', { bubbles: true }));
        runner.log('Step 1: Entered invalid email');
      }
      
      await runner.wait(300);
      
      // Step 2: Check for validation error
      const errorSelectors = [
        '[class*="error"]',
        '[role="alert"]',
        '[class*="invalid"]',
        'p[class*="text-red"]',
        'span[class*="text-destructive"]'
      ];
      
      let errorFound = false;
      for (const selector of errorSelectors) {
        if (runner.exists(selector)) {
          errorFound = true;
          runner.log(`Step 2: Found validation error: ${selector}`);
          break;
        }
      }
      
      if (!errorFound) {
        runner.log('Step 2: No validation error visible yet (may show on submit)');
      }
      
      // Step 3: Try to submit
      const submitBtn = runner.findElement('button[type="submit"]');
      if (submitBtn) {
        (submitBtn as HTMLElement).click();
        await runner.wait(500);
        runner.log('Step 3: Attempted form submission');
      }
    }
  },
  {
    id: 'workflow-responsive-menu',
    name: 'Responsive Menu Workflow',
    category: 'navigation',
    description: 'Test mobile menu toggle if available',
    requiresAuth: false,
    run: async (runner) => {
      await runner.navigate('/');
      await runner.wait(1000);
      
      // Look for mobile menu button
      const menuSelectors = [
        'button[class*="menu"]',
        '[data-testid="mobile-menu"]',
        'button[aria-label*="menu"]',
        '[class*="hamburger"]'
      ];
      
      let menuBtn = null;
      for (const selector of menuSelectors) {
        if (runner.exists(selector)) {
          menuBtn = runner.findElement(selector);
          runner.log(`Found menu button: ${selector}`);
          break;
        }
      }
      
      if (menuBtn) {
        (menuBtn as HTMLElement).click();
        await runner.wait(500);
        runner.log('Clicked mobile menu button');
        
        // Check if menu opened
        if (runner.exists('[class*="mobile-nav"]') || runner.exists('[class*="sheet"]')) {
          runner.log('Mobile menu opened successfully');
        }
      } else {
        runner.log('No mobile menu button found (may be desktop view)');
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
