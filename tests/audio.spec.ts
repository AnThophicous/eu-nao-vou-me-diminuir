import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function installAudioProbe(page: Page) {
  // Observe the actual output graph; never replace Web Audio with a fake.
  await page.addInitScript(() => {
    const probe = {
      contexts: [] as AudioContext[],
      outputs: [] as { context: BaseAudioContext; analyser: AnalyserNode }[],
    };
    Object.defineProperty(window, "__audioProbe", { value: probe });
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = new Proxy(NativeAudioContext, {
      construct(target, args) {
        const context = Reflect.construct(target, args) as AudioContext;
        probe.contexts.push(context);
        return context;
      },
    });
    const originalConnect = AudioNode.prototype.connect;
    Object.defineProperty(AudioNode.prototype, "connect", {
      value: function (
        this: AudioNode,
        destination: AudioNode | AudioParam,
        ...args: number[]
      ) {
        const result = Reflect.apply(originalConnect, this, [
          destination,
          ...args,
        ]);
        if (destination === this.context.destination) {
          const analyser = this.context.createAnalyser();
          analyser.fftSize = 4096;
          analyser.smoothingTimeConstant = 0;
          Reflect.apply(originalConnect, this, [analyser]);
          probe.outputs.push({ context: this.context, analyser });
        }
        return result;
      },
    });
  });
}

async function readAudio(page: Page) {
  return page.evaluate(() => {
    const probe = (
      window as unknown as {
        __audioProbe: {
          contexts: AudioContext[];
          outputs: { context: BaseAudioContext; analyser: AnalyserNode }[];
        };
      }
    ).__audioProbe;
    const output = probe.outputs.at(-1);
    if (!output)
      return {
        contexts: probe.contexts.length,
        state: "none",
        rms: 0,
        audibleBandDb: -160,
      };
    const waveform = new Float32Array(output.analyser.fftSize);
    const spectrum = new Float32Array(output.analyser.frequencyBinCount);
    output.analyser.getFloatTimeDomainData(waveform);
    output.analyser.getFloatFrequencyData(spectrum);
    const rms = Math.sqrt(
      waveform.reduce((sum, sample) => sum + sample * sample, 0) /
        waveform.length,
    );
    const hzPerBin = output.context.sampleRate / output.analyser.fftSize;
    const audibleBand = spectrum.slice(
      Math.ceil(140 / hzPerBin),
      Math.floor(1300 / hzPerBin),
    );
    return {
      contexts: probe.contexts.length,
      state: probe.contexts.at(-1)?.state ?? "none",
      rms,
      audibleBandDb: Math.max(...audibleBand),
    };
  });
}

test("sound produces measurable output in the laptop-speaker band after activation", async ({
  page,
}) => {
  await installAudioProbe(page);
  await page.goto("/");
  expect((await readAudio(page)).contexts).toBe(0);
  await page.getByRole("button", { name: "Ativar som", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Desativar som", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(async () => (await readAudio(page)).rms)
    .toBeGreaterThan(0.005);
  const result = await readAudio(page);
  await test
    .info()
    .attach("audible-output.json", {
      body: JSON.stringify(result, null, 2),
      contentType: "application/json",
    });
  expect(result.state).toBe("running");
  expect(result.audibleBandDb).toBeGreaterThan(-50);
  expect(result.rms).toBeLessThan(0.35);
});

test("volume zero silences every voice and disabling sound closes the context", async ({
  page,
}) => {
  await installAudioProbe(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Ativar som", exact: true }).click();
  await expect
    .poll(async () => (await readAudio(page)).rms)
    .toBeGreaterThan(0.005);
  await page.getByRole("slider", { name: "Volume do som" }).press("Home");
  await expect
    .poll(async () => (await readAudio(page)).rms)
    .toBeLessThan(0.0001);
  await page
    .getByRole("button", { name: "Desativar som", exact: true })
    .click();
  await expect.poll(async () => (await readAudio(page)).state).toBe("closed");
  expect((await readAudio(page)).contexts).toBe(1);
});

test("two activation events before resume completes create only one audio context", async ({
  page,
}) => {
  await installAudioProbe(page);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Ativar som", exact: true })
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
  await expect
    .poll(async () => (await readAudio(page)).rms)
    .toBeGreaterThan(0.005);
  expect((await readAudio(page)).contexts).toBe(1);
  await page
    .getByRole("button", { name: "Desativar som", exact: true })
    .click();
  await expect.poll(async () => (await readAudio(page)).state).toBe("closed");
});

test("hiding the document mutes the score and returning restores its level", async ({
  page,
}) => {
  await installAudioProbe(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Ativar som", exact: true }).click();
  await expect
    .poll(async () => (await readAudio(page)).rms)
    .toBeGreaterThan(0.005);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect
    .poll(async () => (await readAudio(page)).rms)
    .toBeLessThan(0.0001);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect
    .poll(async () => (await readAudio(page)).rms)
    .toBeGreaterThan(0.005);
});
