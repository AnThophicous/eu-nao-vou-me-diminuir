import { expect, test } from "@playwright/test";

test("navigation and action icons are SVGs rather than arrow characters", async ({
  page,
}) => {
  await page.goto("/");
  for (const link of await page.locator(".masthead nav a").all()) {
    await expect(link.locator("svg.lucide")).toHaveCount(1);
  }
  const controls = await page.locator("button, a").allTextContents();
  expect(controls.join("")).not.toMatch(/[↗↺↑↓→▶Ⅱ×]/u);
});

test("the pressure scene changes from restraint into red refusal as it scrolls", async ({
  page,
}) => {
  await page.goto("/#pressao");
  await page.evaluate(() => {
    const section = document.getElementById("pressao")!;
    window.scrollTo(
      0,
      section.offsetTop + (section.offsetHeight - innerHeight) * 0.8,
    );
  });
  await expect(page.locator("#pressao")).toHaveAttribute(
    "data-phase",
    "recusa",
  );
  await expect
    .poll(() =>
      page
        .locator(".pressure-color")
        .evaluate((el) => Number(getComputedStyle(el).opacity)),
    )
    .toBeGreaterThan(0.9);
  await expect(
    page.getByRole("heading", { name: "EU AINDA SINTO." }),
  ).toBeInViewport();
});

test("the visitor can stamp a refusal repeatedly without an unbounded DOM", async ({
  page,
}) => {
  await page.goto("/");
  const button = page.getByRole("button", { name: "CARIMBAR MINHA RECUSA" });
  await button.scrollIntoViewIfNeeded();
  await button.click();
  await expect(page.locator(".voice-stamp")).toHaveCount(1);
  await expect(page.locator(".stamp-control .micro")).toHaveText(
    "SUA RECUSA FICOU MARCADA.",
  );
  for (let i = 0; i < 6; i++) await button.click();
  await expect(page.locator(".voice-stamp")).toHaveCount(1);
});

test("system motion preference preserves the full sticky scene", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#pressao");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  expect(
    await page
      .locator(".pressure-chamber")
      .evaluate((el) => el.getBoundingClientRect().height),
  ).toBeGreaterThan(1000);
  expect(
    await page.evaluate(
      () =>
        document.getAnimations().filter((a) => a.playState === "running")
          .length,
    ),
  ).toBeGreaterThan(0);
});
