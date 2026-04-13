import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

import { absoluteUrl } from "@/lib/utils";

const chromeGuesses = [
  process.env.CHROME_EXECUTABLE_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter(Boolean) as string[];

async function getExecutablePath() {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return chromium.executablePath();
  }

  for (const guess of chromeGuesses) {
    if (guess) {
      return guess;
    }
  }

  return chromium.executablePath();
}

export async function renderPathToPdf(pathname: string) {
  const executablePath = await getExecutablePath();
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: process.env.VERCEL || process.env.NODE_ENV === "production" ? chromium.args : [],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1900, deviceScaleFactor: 2 });
    await page.goto(absoluteUrl(pathname), {
      waitUntil: "networkidle0",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0.35in",
        right: "0.35in",
        bottom: "0.35in",
        left: "0.35in",
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
