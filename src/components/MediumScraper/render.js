const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;

app.use(cors());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.get("/render", async (req, res) => {
  const { url } = req.query;

  if (!url || !url.startsWith("http")) {
    return res.status(400).send("Invalid URL");
  }

  let browser;
  try {

    return res.json({"tweets": sampleTweetPageOutput});

    console.log("🌐 Fetching page content:", url);

    const response = await fetch(url);
    const responseText = await response.text();
    const cleanedHTML = cleanHTMLContent(responseText);
    const extractedContent = extractContentBetweenMarkers(cleanedHTML);

    browser = await puppeteer.launch({
      headless: "new",
      args: ["--disable-features=site-per-process"],
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

    console.log("🌐 Navigating with Puppeteer...");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });

    console.log("📜 Scrolling through page...");
    await autoScroll(page);

    console.log("⏳ Waiting after scroll...");
    await sleep(5000);

    const screenshotPath = path.join(__dirname, "screenshot-after-scroll.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log("📸 Screenshot saved:", screenshotPath);

    const htmlPath = path.join(__dirname, "page-after-scroll.html");
    const pageContent = await page.content();
    fs.writeFileSync(htmlPath, pageContent);
    console.log("💾 HTML content saved:", htmlPath);

    const tweets = await page.evaluate(() => {
      const tweetIframes = Array.from(document.querySelectorAll('iframe[src^="https://cdn.embedly.com/widget"]'));
      return tweetIframes.map(iframe => iframe.title.trim()).filter(title => title.length > 0);
    });

    console.log(`✅ Extracted ${tweets.length} tweet(s)`);

    return res.json({
      tweets,
      mediumPosts: extractedContent,
    });

  } catch (err) {
    console.error("❌ Error during render:", err);
    return res.status(500).send("Render error: " + err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

function cleanHTMLContent(html) {
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<(?!\/?a(?=>|\s.*?>))\/?[^>]*>/gi, '');
  return cleaned.trim();
}

function extractContentBetweenMarkers(html) {
  const leftPointer = html.indexOf("\uD83D\uDC47\uD83C\uDFFF");
  const rightPointer = html.indexOf("\uD83D\uDC48\uD83C\uDFFF");
  const endSymbol = html.indexOf("■", Math.min(leftPointer, rightPointer));

  if (leftPointer !== -1 && rightPointer !== -1 && endSymbol !== -1) {
    return leftPointer < rightPointer
      ? html.substring(leftPointer, endSymbol + 1).trim()
      : html.substring(rightPointer, endSymbol + 1).trim();
  } else if (leftPointer !== -1 && endSymbol !== -1) {
    return html.substring(leftPointer, endSymbol + 1).trim();
  } else if (rightPointer !== -1 && endSymbol !== -1) {
    return html.substring(rightPointer, endSymbol + 1).trim();
  }
  return null;
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 500);
    });
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Render server running at http://localhost:${PORT}`);
});


const sampleTweetPageOutput = [
  '♡ on X (formerly Twitter): "- ayam a user and this is my story-- hi, user#ttb #abeokutakodes pic.twitter.com/CfMdwsTli3 / X"',
  '♡ on X (formerly Twitter): "- i miss it already #humanity https://t.co/jZPiC7MqaN / X"',
  '♡ on X (formerly Twitter): "- no no- daz y e no work- i think the correct thing is- #nnb.deploy(earth)- #abeokutakodes https://t.co/Kl1w5uzhZG / X"',
  `♡ on X (formerly Twitter): "- it's a giant giant pawafool device #nnb https://t.co/OM9LTrBA3S / X"`,       
  'x.com',
  '♡ on X (formerly Twitter): "- tolani, cover your brezz nau. wayayu embarrassing - us#yorubbbygehinny / X"',  '♡ on X (formerly Twitter): "- eez visual, but it responds to you- yuwa in control of your own world#textyng #abeokutakodes https://t.co/9XpWpBZBnX / X"',
  '♡ on X (formerly Twitter): "- #juniorgirls -https://t.co/Y12TCA5MKl / X"',
  '♡ on X (formerly Twitter): "- test me bby- test me!- oohh yeess- daddy#seniorgehs https://t.co/D0OAt8OVvU / X"',
  `♡ on X (formerly Twitter): "- in other news, i have figured out a way to convert books to software in a way that enables everyday readers to create simple apps from their favourite books and with low coding effort using a.i.-- i'd be happy to go over the details in a 1:1 meeting#abeokutakodes / X"`,
  '♡ on X (formerly Twitter): "- #time is the answer - every bit of it#thryd#abeokutakodes https://t.co/KTYXjWPKG0 / X"',
  '♡ on X (formerly Twitter): "- a professor of film#jbt pic.twitter.com/U7bw9LEF8g / X"',
  `♡ on X (formerly Twitter): "- at this point, he knew he don fcked up- one rule, even shagari understood it. you can't fck labour!#seniorboys https://t.co/vsMVLCBI09 / X"`,
  '♡ on X (formerly Twitter): "- #time travel is on a close loop- oooorrrr is it?!#textyng#seniorgehs / X"',  
  '♡ on X (formerly Twitter): "and then shortly after that, we cracked quantum gravity so that people could now talk to spirits without running mad.[[music abbreviations]]#textyng #seniorgehs https://t.co/yuxobyMWoC / X"',
  '♡ on X (formerly Twitter): "[[#tyn = white_house]]- my.transport(#tyn, origin, destination)- na tolu write awa transport library. nice work.- destination = my.near(zuma_rock, sw, 50)- kilomikilometas #abeokutakodes https://t.co/vhddkfofyB pic.twitter.com/GsUBGh6xJi / X"',
  '♡ on X (formerly Twitter): "- oh glory glory glory to da lord!- hosanna - hosanna hosanna blessed be the name of the lord-- you know say normal normal, titi na fine babe#juniorboys pic.twitter.com/MJLKukiN7Y / X"',   
  `♡ on X (formerly Twitter): "- eez simple. if you want to dequeue a queue but you only have two stacks - because such is #life- pls test your #thryd before you push- don't give your viewers buggy experiences- thanks https://t.co/eLFASn8taJ / X"`,
  '♡ on X (formerly Twitter): "and we will just lie and say it was an accident. dey play.#cleack https://t.co/R84ihXpZ3Z / X"',
  '♡ on X (formerly Twitter): "it means neural nuclear bug. na we add the bomb there. just for effect. #nnb https://t.co/cbrm1TNQfK / X"',
  '♡ on X (formerly Twitter): "ok, now, what are memes? where do they fit in all of this complex craziness?#life#humanity #seniorgehs https://t.co/012CrLZVdK / X"',
  `♡ on X (formerly Twitter): "you're right. it is underemployed. it is not achieving potential. it is missing the mark, pastor.#seniorboys / X"`,
  '♡ on X (formerly Twitter): "- hence, trade invents history and geography -#abeokutakodes https://t.co/bIyeFLr99W / X"',
  '♡ on X (formerly Twitter): "- there are molecules, hydrogen, centripetal forces in this world we live in- ehen - how do you intend to conceptualize arrays and indices here?- i create my own world, and give everyone in this world read/write access - #seniorgehs #abeokutakodes https://t.co/BzuES6z884 / X"',
  '♡ on X (formerly Twitter): "my dear, money is not everything. $20m / X"',
  '♡ on X (formerly Twitter): "but...but... [[the urge to say yuwa missing that comma is strong]]#seniorboys / X"',
  `♡ on X (formerly Twitter): "the importance of dreaming and why the white man doesn't want that for you.#oyinboman / X"`,
  '♡ on X (formerly Twitter): "- my self worth is not determined by your acceptance of me#oyinboman - iiifffsss ddeefff soooo https://t.co/uy47NnCSOF / X"',
  '♡ on X (formerly Twitter): "- nawa o. shebi dem don die. person no fit celebrate in peace again. #oyinboman https://t.co/K0CAgFwoe6 / X"',
  `♡ on X (formerly Twitter): "- to all the young boys and girls here. i want to encourage you. just keep #thryd:ing. i know it seems very difficult rn, but your future self will thank you when you start making your own #discovery:s- writer's guild#textyng #abeokutakodes pic.twitter.com/XYfjRk2AEZ / X"`,
  '♡ on X (formerly Twitter): "what is music? water? air? land? sea?[...]what is music?holes? plugs?[...]spark?source?...[sing]#bta https://t.co/dWFIhfGBfd / X"',
  'Remember'
]