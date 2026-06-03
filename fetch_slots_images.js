import puppeteer from "puppeteer";
import fs from "fs";

async function run() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to login page...");
  await page.goto("https://nexcpa.com.br/login", { waitUntil: "networkidle2" });

  console.log("Filling login form...");
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.type('input[type="email"]', "ruan21980@gmail.com");
  await page.type('input[type="password"]', "69608206");

  console.log("Clicking submit...");
  const submitButton = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
  await submitButton.click();

  console.log("Waiting for navigation after login...");
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 });

  console.log("Navigating to slots page...");
  await page.goto("https://nexcpa.com.br/slots", { waitUntil: "networkidle2" });

  console.log("Scraping game cards & images...");
  // Let's find game name and image elements. We will look for elements containing the name and find the img tags.
  const gameData = await page.evaluate(() => {
    // We want to find card structures. Typically, cards are divs containing text and an img tag.
    const cards = [];
    
    // Let's find all images on the page
    const images = Array.from(document.querySelectorAll("img"));
    
    // Let's iterate over cards. Usually cards are elements inside the grid.
    // Let's find all elements that look like cards. We can find elements containing text "Copiar Nome"
    const buttons = Array.from(document.querySelectorAll("button, div, a"));
    const cardContainers = [];
    
    // Find containers of "Copiar Nome"
    buttons.forEach((el) => {
      if (el.textContent && el.textContent.includes("Copiar Nome")) {
        // Find a parent card container. We can go up to find the container.
        let parent = el.parentElement;
        while (parent && parent.tagName !== "BODY") {
          // A card usually has the game name, provider name, etc.
          // Let's check if this parent contains an img. If it does, and it hasn't been added yet, add it.
          const img = parent.querySelector("img");
          if (img && !cardContainers.includes(parent)) {
            cardContainers.push(parent);
            break;
          }
          parent = parent.parentElement;
        }
      }
    });

    console.log("Found card containers:", cardContainers.length);

    cardContainers.forEach((card) => {
      // Find the name of the game (usually an h3, h4, or bold text)
      // Let's get the text headers
      const headings = Array.from(card.querySelectorAll("h3, h4, font, p, span, div"));
      // Find the one that matches our game names (we can just look for the text that isn't "Copiar Nome", provider, tag, or performance)
      // Actually, we can just extract all text contents of the card and filter
      const textList = headings.map(h => h.textContent ? h.textContent.trim() : "").filter(t => t.length > 2);
      
      const img = card.querySelector("img");
      const imgSrc = img ? img.src || img.getAttribute("src") : null;
      
      cards.push({
        html: card.innerHTML,
        textList,
        imgSrc
      });
    });

    if (cards.length === 0) {
      // Fallback: just list all images and adjacent text
      return images.map(img => ({
        imgSrc: img.src || img.getAttribute("src"),
        alt: img.alt,
        class: img.className,
        parentText: img.parentElement ? img.parentElement.textContent : ""
      }));
    }

    return cards;
  });

  console.log("Scraped", gameData.length, "elements. Writing to file...");
  fs.writeFileSync("scraped_images.json", JSON.stringify(gameData, null, 2));
  console.log("Saved to scraped_images.json");

  await browser.close();
}

run().catch(console.error);
