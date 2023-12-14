"use server";

import axios from "axios";
import * as cheerio from "cheerio";


export async function scrapeAmazonProduct(url: string) {
  if (!url) return;

  // BrightData proxy configuration
  // console.log("fdsfsdfdsfdddddddddddddddddddddddddddddddd")
  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const port = 22225;
  const session_id = (1000000 * Math.random()) | 0;

  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
    host: "brd.superproxy.io",
    port,
    rejectUnauthorized: false,
  };

  try {
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);

    // Extract the product title
    const title = $("#productTitle").text().trim();

    // Extract the current price
    const currentPriceElement = $(
      "#corePriceDisplay_desktop_feature_div .a-price.aok-align-center.reinventPricePriceToPayMargin.priceToPay .a-price-whole"
    );
    const currentPrice = currentPriceElement.text().trim();
    // Extract the original price (M.R.P.)

    const originalPriceElement = $(
      "#corePriceDisplay_desktop_feature_div .a-size-small.a-color-secondary.aok-align-center.basisPrice .a-price .a-offscreen"
    );
    const originalPrice = originalPriceElement.text().replace(/[₹,]/g, "");

   
    console.log("Original Price (M.R.P.):", originalPrice);
    console.log("Current Price (M.R.P.):", currentPrice);
  } catch (error: any) {
    throw new Error(`Failed to scrape the product ${error.message}`);
  }
}
