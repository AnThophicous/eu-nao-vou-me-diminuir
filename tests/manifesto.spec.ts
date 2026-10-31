import { expect, test } from "@playwright/test";

test("manifesto renders, hero shader works and navigation reaches the first chapter", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText(
    "EU NÃO VOUME DIMINUIR.POR UM PADRÃO INDUSTRIAL.",
  );
  await expect(page.locator(".hero .stage")).toHaveAttribute(
    "data-webgl",
    "ready",
  );
  await expect(page.locator(".hero .stage")).toHaveAttribute(
    "data-draw-calls",
    "1",
  );
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "O manifesto" })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        return Math.abs(
          document.querySelector("#manifesto")!.getBoundingClientRect().top -
            96,
        );
      }),
    )
    .toBeLessThan(12);
  await expect(page.locator(".signature")).toContainText(
    "Brenno Leon de Souza Amaral",
  );
  expect(errors).toEqual([]);
});

test("pointer hold can be cancelled, completed and replayed", async ({
  page,
}) => {
  await page.goto("/#ruptura");
  const button = page.getByRole("button", { name: /SEGURE PARA ROMPER/ });
  await button.scrollIntoViewIfNeeded();
  const box = (await button.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(page.getByRole("progressbar")).not.toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await page.mouse.up();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await expect(page.locator("#ruptura")).not.toHaveClass(/is-released/);
  await page.mouse.down();
  await expect(page.locator("#ruptura")).toHaveClass(/is-released/, {
    timeout: 12_000,
  });
  await page.mouse.up();
  await expect(page.getByRole("status")).toContainText(
    "Você não precisa desaparecer",
  );
  await page.getByRole("button", { name: "Sentir de novo" }).click();
  await expect(button).toBeVisible();
});

test("keyboard can release the composition without a timed hold", async ({
  page,
}) => {
  await page.goto("/#ruptura");
  const button = page.getByRole("button", { name: /SEGURE PARA ROMPER/ });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#ruptura")).toHaveClass(/is-released/);
});

test("changing away from the page cancels an unfinished hold", async ({
  page,
}) => {
  await page.goto("/#ruptura");
  const button = page.getByRole("button", { name: /SEGURE PARA ROMPER/ });
  await button.scrollIntoViewIfNeeded();
  const box = (await button.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(page.getByRole("progressbar")).not.toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await page.evaluate(() => dispatchEvent(new Event("blur")));
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await page.mouse.up();
  await expect(page.locator("#ruptura")).not.toHaveClass(/is-released/);
});

test("the skip link appears on the first Tab and moves into the manifesto", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Pular para o manifesto" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  expect(await skip.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe(
    "solid",
  );
  await page.keyboard.press("Enter");
  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.abs(
          document.querySelector("#manifesto")!.getBoundingClientRect().top -
            96,
        ),
      ),
    )
    .toBeLessThan(12);
});

test("system reduced motion does not override the full-motion default", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#ruptura");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  await expect(
    page.getByRole("button", { name: "Pausar movimento" }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: /SEGURE PARA ROMPER/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator("#ruptura")).toHaveClass(/is-released/);
});

test("motion toggle pauses decoration without preventing navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pausar movimento" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await page.getByRole("link", { name: "A ruptura" }).click();
  await expect(
    page.getByRole("button", { name: "ROMPER O PADRÃO" }),
  ).toBeInViewport();
});

test("audio starts silent and can be enabled and disabled", async ({
  page,
}) => {
  await page.goto("/");
  const button = page.getByRole("button", { name: "Ativar som", exact: true });
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await button.click();
  await expect(
    page.getByRole("button", { name: "Desativar som", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Desativar som", exact: true })
    .click();
  await expect(button).toHaveAttribute("aria-pressed", "false");
});

test("lost WebGL context retains fallback after resize and can recover", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".hero .stage")).toHaveAttribute(
    "data-webgl",
    "ready",
  );
  await page
    .locator(".hero canvas")
    .evaluate((canvas) =>
      canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  await page.setViewportSize({ width: 1300, height: 900 });
  await expect(page.locator(".hero .stage")).toHaveAttribute(
    "data-webgl",
    "fallback",
  );
  await expect(page.locator(".hero .stage-fallback")).toBeVisible();
  await page
    .locator(".hero canvas")
    .evaluate((canvas) =>
      canvas.dispatchEvent(new Event("webglcontextrestored")),
    );
  await expect(page.locator(".hero .stage")).toHaveAttribute(
    "data-webgl",
    "ready",
  );
});

test("WebGL failure preserves the manifesto and a visible static image", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      id: string,
      options?: unknown,
    ) {
      if (id.includes("webgl")) return null;
      return original.call(this, id as "2d", options);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator(".hero .stage")).toHaveAttribute(
    "data-webgl",
    "fallback",
  );
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".hero .stage-fallback")).toBeVisible();
});

for (const width of [360, 390, 834, 1440]) {
  test(`layout remains inside viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
    await expect(page.locator(".enter-link")).toBeInViewport();
    await expect(page.locator(".chapter-copy")).toHaveCount(4);
  });
}
