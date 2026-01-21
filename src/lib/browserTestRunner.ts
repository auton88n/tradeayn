export interface BrowserTestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration_ms: number;
  error_message?: string;
  step_details?: string[];
}

export interface TestProgress {
  currentTest: string;
  currentStep: string;
  testIndex: number;
  totalTests: number;
  stepLogs: string[];
}

export type ProgressCallback = (progress: TestProgress) => void;

export interface TestStep {
  action: string;
  target?: string;
  value?: string;
  timeout?: number;
}

export class BrowserTestRunner {
  private logs: string[] = [];
  private safeMode: boolean = true; // Default to safe mode - no actual navigation
  private progressCallback: ProgressCallback | null = null;
  private currentTestName: string = '';
  private testIndex: number = 0;
  private totalTests: number = 0;

  setSafeMode(enabled: boolean): void {
    this.safeMode = enabled;
  }

  setProgressCallback(callback: ProgressCallback | null): void {
    this.progressCallback = callback;
  }

  setTestContext(name: string, index: number, total: number): void {
    this.currentTestName = name;
    this.testIndex = index;
    this.totalTests = total;
  }

  private notifyProgress(step: string): void {
    if (this.progressCallback) {
      this.progressCallback({
        currentTest: this.currentTestName,
        currentStep: step,
        testIndex: this.testIndex,
        totalTests: this.totalTests,
        stepLogs: [...this.logs]
      });
    }
  }

  log(message: string): void {
    const logEntry = `[${new Date().toISOString()}] ${message}`;
    this.logs.push(logEntry);
    console.log(`[BrowserTest] ${message}`);
    this.notifyProgress(message);
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  async wait(ms: number): Promise<void> {
    this.log(`Waiting ${ms}ms...`);
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Find element by various selectors
  findElement(selector: string): HTMLElement | null {
    // Try direct selector first
    let element = document.querySelector(selector) as HTMLElement;
    if (element) return element;

    // Try finding by text content
    if (selector.includes(':has-text(')) {
      const match = selector.match(/:has-text\("([^"]+)"\)/);
      if (match) {
        const text = match[1];
        const baseSelector = selector.split(':has-text')[0] || '*';
        const elements = document.querySelectorAll(baseSelector);
        for (const el of elements) {
          if (el.textContent?.includes(text)) {
            return el as HTMLElement;
          }
        }
      }
    }

    // Try by aria-label
    if (selector.startsWith('[aria-label=')) {
      return document.querySelector(selector) as HTMLElement;
    }

    // Try by role and name
    if (selector.includes('[role=')) {
      return document.querySelector(selector) as HTMLElement;
    }

    return null;
  }

  // Click an element
  async click(selector: string): Promise<void> {
    this.log(`Clicking: ${selector}`);
    const element = this.findElement(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    
    // Scroll into view
    element.scrollIntoView({ behavior: 'instant', block: 'center' });
    await this.wait(100);
    
    // Trigger click
    element.click();
    this.log(`Clicked: ${selector}`);
    await this.wait(300);
  }

  // Fill an input field
  async fill(selector: string, value: string): Promise<void> {
    this.log(`Filling: ${selector} with value`);
    const input = this.findElement(selector) as HTMLInputElement | HTMLTextAreaElement;
    if (!input) {
      throw new Error(`Input not found: ${selector}`);
    }

    // Focus the input
    input.focus();
    await this.wait(50);

    // Clear existing value
    input.value = '';
    
    // Set new value
    input.value = value;
    
    // Dispatch events to trigger React state updates
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    this.log(`Filled: ${selector}`);
    await this.wait(100);
  }

  // Wait for an element to appear
  async waitForSelector(selector: string, timeout = 5000): Promise<HTMLElement> {
    this.log(`Waiting for: ${selector}`);
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      const element = this.findElement(selector);
      if (element) {
        this.log(`Found: ${selector}`);
        return element;
      }
      await this.wait(100);
    }
    
    throw new Error(`Timeout (${timeout}ms) waiting for: ${selector}`);
  }

  // Wait for element to disappear
  async waitForSelectorToDisappear(selector: string, timeout = 5000): Promise<void> {
    this.log(`Waiting for disappear: ${selector}`);
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      const element = this.findElement(selector);
      if (!element) {
        this.log(`Disappeared: ${selector}`);
        return;
      }
      await this.wait(100);
    }
    
    throw new Error(`Timeout waiting for element to disappear: ${selector}`);
  }

  // Check if element exists
  exists(selector: string): boolean {
    return this.findElement(selector) !== null;
  }

  // Check if element is visible
  isVisible(selector: string): boolean {
    const element = this.findElement(selector);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      style.opacity !== '0'
    );
  }

  // Get text content of element
  getText(selector: string): string {
    const element = this.findElement(selector);
    return element?.textContent?.trim() || '';
  }

  // Navigate to a path - in safe mode, just verify the route would work
  async navigate(path: string): Promise<void> {
    if (this.safeMode) {
      this.log(`[Safe Mode] Simulating navigation to: ${path}`);
      // In safe mode, we don't actually navigate - we verify the current page state
      // This prevents leaving the admin panel
      this.log(`[Safe Mode] Skipping actual navigation to preserve admin panel`);
      return;
    }
    
    this.log(`Navigating to: ${path}`);
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    await this.wait(1000);
    this.log(`Navigated to: ${path}`);
  }

  // Check if a route is accessible (without navigating)
  async checkRouteExists(path: string): Promise<boolean> {
    this.log(`Checking route exists: ${path}`);
    // We can't actually verify without navigating in a SPA
    // But we can check if the route pattern is valid
    const validRoutes = ['/', '/engineering', '/support', '/settings', '/admin', '/grading', '/marketing'];
    const isValid = validRoutes.some(route => path.startsWith(route) || path === route);
    this.log(`Route ${path} validity: ${isValid}`);
    return isValid;
  }

  // Get current URL path
  getCurrentPath(): string {
    return window.location.pathname;
  }

  // Capture page state for debugging
  captureState(): object {
    return {
      url: window.location.pathname,
      title: document.title,
      hasDialogs: document.querySelectorAll('[role="dialog"]').length,
      hasAlerts: document.querySelectorAll('[role="alert"]').length,
      formCount: document.querySelectorAll('form').length,
      buttonCount: document.querySelectorAll('button').length,
      inputCount: document.querySelectorAll('input, textarea').length,
    };
  }

  // Execute a test with timing and error handling
  async runTest(
    name: string,
    testFn: (runner: BrowserTestRunner) => Promise<void>
  ): Promise<BrowserTestResult> {
    this.clearLogs();
    const startTime = Date.now();
    
    try {
      await testFn(this);
      return {
        name,
        status: 'passed',
        duration_ms: Date.now() - startTime,
        step_details: this.getLogs(),
      };
    } catch (error) {
      return {
        name,
        status: 'failed',
        duration_ms: Date.now() - startTime,
        error_message: error instanceof Error ? error.message : String(error),
        step_details: this.getLogs(),
      };
    }
  }
}

// Singleton instance
export const browserTestRunner = new BrowserTestRunner();
