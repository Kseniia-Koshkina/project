const { test, expect } = require("@playwright/test");

test("Server responds with a page with the title 'Programming assignments'", async ({ page }) => {
  await page.goto("/");
  expect(await page.title()).toBe("Programming assignments");
});

test("(1) Check a response to a submission that fails the test", async ({ page }) => {
  await page.goto("/");

  const incorrectSubmission = 'def hello():\n\treturn "incorrect text"';

  await page.waitForFunction(() => {
    const textarea = document.querySelector('[data-testid="assignment-info"]');
    return textarea && textarea.value !== 'Loading...';
  });

  // fill textare with incorrect code
  const submissionArea = page.locator('[data-testid="submission-area"]');
  await submissionArea.fill(incorrectSubmission);

  // press Submit button
  await page.getByRole('button', { name: 'Submit' }).click();

  // wait for submission to append in the submission field
  const buttonLocator = page.locator('[data-testid="submission-info"] button');
  await buttonLocator.waitFor();

  await page.waitForFunction(() => {
    const button = document.getElementById('open-submission-button');
    const buttonText = button.textContent;
    console.log(buttonText);
    return button.textContent.includes('processed');
  });

  const hiddenContent = await page.locator('[data-testid="submission-info"] div.text-left');
  await expect(buttonLocator).toHaveText(/processed/);
  await expect(hiddenContent).toHaveText(/Error/);
});

test("(2) Check a response to a submission that passes the test", async ({ page }) => {
  await page.goto("/");

  const correctSubmission = 'def hello():\n\treturn "Hello"';

  await page.waitForFunction(() => {
    const textarea = document.querySelector('[data-testid="assignment-info"]');
    return textarea && textarea.value !== 'Loading...';
  });

  // fill textare with incorrect code
  const submissionArea = page.locator('[data-testid="submission-area"]');
  await submissionArea.fill(correctSubmission);

  // press Submit button
  await page.getByRole('button', { name: 'Submit' }).click();

  // wait for submission to append in the submission field
  const buttonLocator = page.locator('[data-testid="submission-info"] button');
  await buttonLocator.waitFor();

  await page.waitForFunction(() => {
    const button = document.getElementById('open-submission-button');
    const buttonText = button.textContent;
    console.log(buttonText);
    return button.textContent.includes('processed');
  });

  const hiddenContent = await page.locator('[data-testid="submission-info"] div.text-left');
  console.log(await hiddenContent.textContent())
  await expect(buttonLocator).toHaveText(/processed/);
  await expect(hiddenContent).toHaveText(/OK/);
});

test("(3) Check a response to a submission that passes the test and check the wether the next assignment is a new one", async ({ page }) => {
  await page.goto("/");

  const correctSubmission = 'def hello():\n\treturn "Hello"';

  await page.waitForFunction(() => {
    const textarea = document.querySelector('[data-testid="assignment-info"]');
    return textarea && textarea.value !== 'Loading...';
  });

  const textOfFirstAssignment = await page.locator('[data-testid="assignment-info"]').inputValue();

  const submissionArea = page.locator('[data-testid="submission-area"]');
  await submissionArea.fill(correctSubmission);

  await page.getByRole('button', { name: 'Submit' }).click();

  const buttonLocator = page.locator('[data-testid="submission-info"] button');
  await buttonLocator.waitFor();

  await page.waitForFunction(() => {
    const button = document.getElementById('open-submission-button');
    const buttonText = button.textContent;
    console.log(buttonText);
    return button.textContent.includes('processed');
  });

  const hiddenContent = await page.locator('[data-testid="submission-info"] div.text-left');
  await expect(buttonLocator).toHaveText(/processed/);
  await expect(hiddenContent).toHaveText(/OK/);

  await page.getByRole('button', { name: 'Next' }).click();
  const textOfNextAssignment = await page.locator('[data-testid="assignment-info"]').inputValue();
  expect(textOfNextAssignment !== textOfFirstAssignment).toBeTruthy()
});

test("(4) Check whether the score increases for a correct submission", async ({ page }) => {
  await page.goto("/");

  const correctSubmission = 'def hello():\n\treturn "Hello"';

  await page.waitForFunction(() => {
    const textarea = document.querySelector('[data-testid="assignment-info"]');
    return textarea && textarea.value !== 'Loading...';
  });

  const scoreBeforeSubmission = page.getByText(/Total score:/);
  await expect(scoreBeforeSubmission).toHaveText("Total score: 0");

  const submissionArea = page.locator('[data-testid="submission-area"]');
  await submissionArea.fill(correctSubmission);

  await page.getByRole('button', { name: 'Submit' }).click();

  const buttonLocator = page.locator('[data-testid="submission-info"] button');
  await buttonLocator.waitFor();

  await page.waitForFunction(() => {
    const button = document.getElementById('open-submission-button');
    const buttonText = button.textContent;
    console.log(buttonText);
    return button.textContent.includes('processed');
  });

  const hiddenContent = await page.locator('[data-testid="submission-info"] div.text-left');
  const scoreAfterSubmission = page.getByText(/Total score:/);
  await expect(buttonLocator).toHaveText(/processed/);
  await expect(hiddenContent).toHaveText(/OK/);
  await expect(scoreAfterSubmission).toHaveText("Total score: 100");
});

test("(5) Verify that the score does not increase for an incorrect submission", async ({ page }) => {
  await page.goto("/");

  const inCorrectSubmission = 'def hello():\n\treturn "incorrect text"';

  await page.waitForFunction(() => {
    const textarea = document.querySelector('[data-testid="assignment-info"]');
    return textarea && textarea.value !== 'Loading...';
  });

  const scoreBeforeSubmission = page.getByText(/Total score:/);
  await expect(scoreBeforeSubmission).toHaveText("Total score: 0");

  const submissionArea = page.locator('[data-testid="submission-area"]');
  await submissionArea.fill(inCorrectSubmission);

  await page.getByRole('button', { name: 'Submit' }).click();

  const buttonLocator = page.locator('[data-testid="submission-info"] button');
  await buttonLocator.waitFor();

  await page.waitForFunction(() => {
    const button = document.getElementById('open-submission-button');
    const buttonText = button.textContent;
    console.log(buttonText);
    return button.textContent.includes('processed');
  });

  const hiddenContent = await page.locator('[data-testid="submission-info"] div.text-left');
  const scoreAfterSubmission = page.getByText(/Total score:/);
  await expect(buttonLocator).toHaveText(/processed/);
  await expect(hiddenContent).toHaveText(/Error/);
  await expect(scoreAfterSubmission).toHaveText("Total score: 0");
});