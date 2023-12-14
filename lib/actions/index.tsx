"use server"
import { scrapeAmazonProduct } from "../scraper/index";

export async function scrapeAndStoreProduct(productUrl: string) {
    if(!productUrl) return;
    try{

        const scrapedProduct = await scrapeAmazonProduct(productUrl);

    }catch(error:any){
        throw new Error(`failed to create/update new product: ${error.message}`)
    }
}