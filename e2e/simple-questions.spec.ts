import { test, expect } from '@playwright/test';

test.describe('Simple Question Creation', () => {
  test('can access quick question page from home', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Quick Question').click();

    await expect(page).toHaveURL('/create/simple');
    await expect(page.getByPlaceholder("What's your question?")).toBeVisible();
  });

  test('can create a simple question', async ({ page }) => {
    await page.goto('/create/simple');

    await page.getByPlaceholder("What's your question?").fill('How many stars in the sky?');
    await page.getByPlaceholder('Min').fill('0');
    await page.getByPlaceholder('Max').fill('1000');
    await page.getByPlaceholder('Answer').fill('500');

    await page.getByRole('button', { name: 'Create' }).click();

    // Should redirect to /s/{id}
    await expect(page).toHaveURL(/\/s\/[a-f0-9]{7}/);
    await expect(page.getByText('How many stars in the sky?')).toBeVisible();
  });

  test('can add description via +Details button', async ({ page }) => {
    await page.goto('/create/simple');

    // Click +Details to show description field
    await page.getByText('Details').click();

    await expect(page.getByPlaceholder('Add more context (optional)')).toBeVisible();

    await page.getByPlaceholder("What's your question?").fill('Test question');
    await page.getByPlaceholder('Add more context (optional)').fill('This is extra context');
    await page.getByPlaceholder('Min').fill('1');
    await page.getByPlaceholder('Max').fill('10');
    await page.getByPlaceholder('Answer').fill('5');

    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page).toHaveURL(/\/s\/[a-f0-9]{7}/);
    await expect(page.getByText('This is extra context')).toBeVisible();
  });

  test('can set a reveal PIN', async ({ page }) => {
    await page.goto('/create/simple');

    await page.getByPlaceholder("What's your question?").fill('PIN protected question');
    await page.getByPlaceholder('Min').fill('0');
    await page.getByPlaceholder('Max').fill('100');
    await page.getByPlaceholder('Answer').fill('42');

    // Click the lock button to enable PIN
    await page.locator('button').filter({ has: page.locator('svg') }).nth(1).click();

    // PIN field should appear with auto-generated value
    const pinInput = page.getByPlaceholder('PIN');
    await expect(pinInput).toBeVisible();
    const pin = await pinInput.inputValue();
    expect(pin).toMatch(/^\d{6}$/);

    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page).toHaveURL(/\/s\/[a-f0-9]{7}/);
  });

  test('validates required fields', async ({ page }) => {
    await page.goto('/create/simple');

    // Create button should be disabled without required fields
    await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled();

    // Fill only title
    await page.getByPlaceholder("What's your question?").fill('Test');
    await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled();

    // Fill min/max but not answer
    await page.getByPlaceholder('Min').fill('0');
    await page.getByPlaceholder('Max').fill('100');
    await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled();

    // Fill answer - now should be enabled
    await page.getByPlaceholder('Answer').fill('50');
    await expect(page.getByRole('button', { name: 'Create' })).toBeEnabled();
  });
});

test.describe('Simple Question Guessing', () => {
  let questionUrl: string;

  test.beforeEach(async ({ page }) => {
    // Create a simple question first
    await page.goto('/create/simple');
    await page.getByPlaceholder("What's your question?").fill('Guess the number');
    await page.getByPlaceholder('Min').fill('0');
    await page.getByPlaceholder('Max').fill('100');
    await page.getByPlaceholder('Answer').fill('73');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page).toHaveURL(/\/s\/[a-f0-9]{7}/);
    questionUrl = page.url();
  });

  test('shows question title and guess count', async ({ page }) => {
    await page.goto(questionUrl);

    await expect(page.getByText('Guess the number')).toBeVisible();
    // Check for "0 guesses" text (guess count display)
    await expect(page.locator('text=0guesses')).toBeVisible();
  });

  test('shows number line with range labels', async ({ page }) => {
    await page.goto(questionUrl);

    // Should show min and max labels
    await expect(page.getByText('0').first()).toBeVisible();
    await expect(page.getByText('100')).toBeVisible();
  });

  test('can submit guess by clicking number line', async ({ page }) => {
    await page.goto(questionUrl);

    // Get the number line element
    const numberLine = page.locator('.cursor-crosshair');
    await expect(numberLine).toBeVisible();

    // Click somewhere on the number line
    const box = await numberLine.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2);
    }

    // Should show "Guess recorded!"
    await expect(page.getByText('Guess recorded!')).toBeVisible();
    // Guess count should increment (shows "1 guess" now)
    await expect(page.locator('text=1guess')).toBeVisible();
  });

  test('can guess again after first guess', async ({ page }) => {
    await page.goto(questionUrl);

    const numberLine = page.locator('.cursor-crosshair');
    const box = await numberLine.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width * 0.3, box.y + box.height / 2);
    }

    await expect(page.getByText('Guess recorded!')).toBeVisible();

    // Click "Guess again" button
    await page.getByRole('button', { name: 'Guess again' }).click();

    // Should be able to guess again
    await expect(page.locator('.cursor-crosshair')).toBeVisible();
  });
});

test.describe('Simple Question Reveal', () => {
  test('can reveal answer without PIN', async ({ page }) => {
    // Create question without PIN
    await page.goto('/create/simple');
    await page.getByPlaceholder("What's your question?").fill('No PIN question');
    await page.getByPlaceholder('Min').fill('0');
    await page.getByPlaceholder('Max').fill('100');
    await page.getByPlaceholder('Answer').fill('42');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page).toHaveURL(/\/s\/[a-f0-9]{7}/);

    // Click reveal
    await page.getByRole('button', { name: 'Reveal Answer' }).click();

    // Answer should be shown
    await expect(page.getByText('Answer: 42')).toBeVisible();
  });

  test('PIN-protected question requires PIN to reveal', async ({ page }) => {
    // Create question with PIN
    await page.goto('/create/simple');
    await page.getByPlaceholder("What's your question?").fill('PIN question');
    await page.getByPlaceholder('Min').fill('0');
    await page.getByPlaceholder('Max').fill('100');
    await page.getByPlaceholder('Answer').fill('42');

    // Enable PIN
    await page.locator('button').filter({ has: page.locator('svg') }).nth(1).click();
    const pinInput = page.getByPlaceholder('PIN');
    await pinInput.fill('123456');

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page).toHaveURL(/\/s\/[a-f0-9]{7}/);

    // Reveal button should show lock icon
    const revealButton = page.getByRole('button', { name: 'Reveal Answer' });
    await expect(revealButton).toBeVisible();

    // Click reveal - should show PIN input
    await revealButton.click();
    await expect(page.getByPlaceholder('Enter PIN')).toBeVisible();

    // Enter wrong PIN
    await page.getByPlaceholder('Enter PIN').fill('000000');
    await page.getByRole('button', { name: 'Reveal' }).click();

    // Should show error (PIN input has error styling)
    await expect(page.getByPlaceholder('Enter PIN')).toHaveClass(/border-destructive/);

    // Enter correct PIN
    await page.getByPlaceholder('Enter PIN').fill('123456');
    await page.getByRole('button', { name: 'Reveal' }).click();

    // Answer should be shown
    await expect(page.getByText('Answer: 42')).toBeVisible();
  });

  test('cannot submit guess after reveal', async ({ page }) => {
    await page.goto('/create/simple');
    await page.getByPlaceholder("What's your question?").fill('Revealed question');
    await page.getByPlaceholder('Min').fill('0');
    await page.getByPlaceholder('Max').fill('100');
    await page.getByPlaceholder('Answer').fill('50');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page).toHaveURL(/\/s\/[a-f0-9]{7}/);

    // Reveal first
    await page.getByRole('button', { name: 'Reveal Answer' }).click();
    await expect(page.getByText('Answer: 50')).toBeVisible();

    // Number line should no longer have crosshair cursor (not clickable)
    await expect(page.locator('.cursor-crosshair')).not.toBeVisible();
  });
});
