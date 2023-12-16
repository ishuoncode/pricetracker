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
    const currentPrice = currentPriceElement.text().trim().replace(/,/g, '');

    // Extract the original price (M.R.P.)

    const originalPriceElement = $(
      "#corePriceDisplay_desktop_feature_div .a-size-small.a-color-secondary.aok-align-center.basisPrice .a-price .a-offscreen"
    );
    const currency = originalPriceElement.text()[0];
    const originalPrice = originalPriceElement.text().replace(/[₹,]/g, "");

    const outOfStock =
      $("#availability span").text().trim().toLowerCase() ===
      "currently unavailable";

    const images =
      $("#imgBlkFront").attr("data-a-dynamic-image") ||
      $("#landingImage").attr("data-a-dynamic-image") ||
      "{}";
    const imagesUrls = Object.keys(JSON.parse(images));

    const discountRate = $(".savingsPercentage").text().replace(/[-%]/g, "");

    const stars = $("#acrPopover .a-size-base.a-color-base").text().trim();
    
    const reviewsCount = $("#acrCustomerReviewText")
      .text()
      .trim()
      .split(" ")[0].replace(/,/g, '');
  
    
      

    //construct data object
    const data = {
      url,
      title,
      stars:Number(stars),
      reviewsCount:Number(reviewsCount),
      image: imagesUrls[0],
      currency: currency || "₹",
      currentPrice: Number(currentPrice),
      originalPrice: Number(originalPrice),
      priceHistory: [],
      discountRate: Number(discountRate),
      isOutOfStock: outOfStock,
      lowestPrice:Number(currentPrice) || Number(originalPrice),
      highestPrice:Number(originalPrice) || Number(currentPrice),
      averagePrice:Number(currentPrice) || Number(originalPrice)
    };
    // console.log("🚀 ~ file: index.tsx:78 ~ scrapeAmazonProduct ~ data:", data);
    return data
  } catch (error: any) {
    throw new Error(`Failed to scrape the product ${error.message}`);
  }
}
