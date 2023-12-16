import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { scrapeAmazonProduct } from "@/lib/scraper";
import {
  getAveragePrice,
  getEmailNotifType,
  getHighestPrice,
  getLowestPrice,
} from "@/lib/utils";
import { product } from "@/types";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    connectToDB();
    const products = await Product.find({});
    if (!products) throw new Error("No product found");

    //Scrape latest product and update DB

    const updatedProducts = await Promise.all(
        products.map(async (currentProduct:product) => {
          // Scrape product
          const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);
  
          if (!scrapedProduct) return;
  
          const updatedPriceHistory = [
            ...currentProduct.priceHistory,
            {
              price: scrapedProduct.currentPrice,
            },
          ];
  
          const product = {
            ...scrapedProduct,
            priceHistory: updatedPriceHistory,
            lowestPrice: getLowestPrice(updatedPriceHistory),
            highestPrice: getHighestPrice(updatedPriceHistory),
            averagePrice: getAveragePrice(updatedPriceHistory),
          };
  
          // Update Products in DB
          const updatedProduct = await Product.findOneAndUpdate(
            {
              url: product.url,
            },
            product
          );
  
          // ======================== 2 CHECK EACH PRODUCT'S STATUS & SEND EMAIL ACCORDINGLY
          const emailNotifType = getEmailNotifType(
            scrapedProduct,
            currentProduct
          );
  
          if (emailNotifType && updatedProduct.users.length > 0) {
            const productInfo = {
              title: updatedProduct.title,
              url: updatedProduct.url,
            };
            // Construct emailContent
            const emailContent = await generateEmailBody(productInfo, emailNotifType);
            // Get array of user emails
            const userEmails = updatedProduct.users.map((user: any) => user.email);
            // Send email notification
            await sendEmail(emailContent, userEmails);
          }
  
          return updatedProduct;
        })
      );
    return NextResponse.json({
        message:'OK',
        data:updatedProducts
    })
  } catch (error:any) {
    throw new Error(`Error in GET: ${error.message}`);
  }
}
