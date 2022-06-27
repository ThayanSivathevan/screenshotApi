const puppeteer = require("puppeteer");
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors({origin: "https://storyappcreator.herokuapp.com" }));
app.get("/screenshot", async (req, res) => {
  try {
    console.log("recieved");
    const browser = await puppeteer.launch({
      'args': [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--proxy-server="direct://"',
        '--proxy-bypass-list=*'
      ]
    });
    const page = await browser.newPage();
    await page.goto(req.query.url); // URL is given by the "user" (your client-side application)

    await page.evaluate(async () => {
      // Scroll down to bottom of page to activate lazy loading images
      document.body.scrollIntoView(false);

      // Wait for all remaining lazy loading images to load
      await Promise.all(
        Array.from(document.getElementsByTagName("img"), (image) => {
          if (image.complete) {
            return;
          }

          return new Promise((resolve, reject) => {
            image.addEventListener("load", resolve);
            image.addEventListener("error", reject);
          });
        })
      );
    });
    const logo = await page.$("body");
    const screenshotBuffer = await logo.screenshot();

    // Respond with the image
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": screenshotBuffer.length,
    });
    res.end(screenshotBuffer);

    await browser.close();
  }
  catch (e) {
    console.log(e)
    res.status(422).send({ "message": "Could not screenshot" })

  }
});

app.listen(process.env.PORT || 5002);
