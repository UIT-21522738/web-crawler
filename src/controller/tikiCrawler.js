import { Builder, By, Key, until } from 'selenium-webdriver';
import { mkConfig, generateCsv, asString } from "export-to-csv";
import { writeFile } from "node:fs";
import { Buffer } from "node:buffer";

async function getProductId(query) {
  const driver = await new Builder().forBrowser('chrome').build();
  var p_ids = [];
  let pageNumber = 1;

  try {
    while (p_ids.length <= 501) {
        await driver.get(`https://tiki.vn/search?q=${query}&page=${pageNumber}`);
        await driver.wait(until.elementLocated(By.xpath('//*[@id="__next"]/div[1]/main/div/div[2]/div[1]/div[2]')), 20000);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const all = await driver.findElement(By.xpath('//*[@id="__next"]/div[1]/main/div/div[2]/div[1]/div[2]'));
        const products = await all.findElements(By.className("style__ProductLink-sc-139nb47-2 cKoUly product-item"));
        for (const product of products) { 
            const d = await product.getAttribute('data-view-content');
            console.log(d);
            const data = await JSON.parse(d)['click_data'];
            console.log("data: ", data);
            p_ids.push(data['id']);
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
        pageNumber++;
    }
    console.log(p_ids);
  }
  catch (e) {
    console.log(e);
   }
  finally {
    if (driver) {
        await driver.close();
    }
  }
  return p_ids;
}


export async function TikiCrawl(query, res) {
  const ids = await getProductId(query);
  const pdata = [];
  for (const id of ids) 
  {
    try {
      const response = await fetch(`https://tiki.vn/api/v2/products/${id}`);
      const data = await response.json();
      const {
        sku,
        name,
        price,
        short_description,
        description,
        categories,
        brand,
        images,
        stock_item: {qty},
      } = data;

      const minifiedDescription = description.replace(/(\r\n|\n|\r)/gm, " ");
      const image_urls = images.map((image) => image.base_url).join(", ");
      pdata.push({
        SKU: sku,
        Name: name,
        Price: price,
        Short_Description: short_description,
        Description: minifiedDescription,
        Category: categories["name"],
        Brand: brand["name"],
        Images: image_urls,
        Quantity: qty,
      })
      let i = Math.round(Math.random() * 60);
      if (i === 29) {
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }
    }
    catch (error) {
      console.error(`Error fetching product details for ${id}:`, error);
    } 
  }
  try {
    const csvConfig = mkConfig({ useKeysAsHeaders: true });
    const csv = generateCsv(csvConfig)(pdata);
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `data/tiki-${query}-${date}.csv`;
    const csvBuffer = new Uint8Array(Buffer.from(asString(csv)));
    // Write the csv file to disk
    writeFile(filename, csvBuffer, (err) => {
      if (err) throw err;
      console.log("file saved: ", filename);
    }); 
  } catch (e) {
    console.log("error: ", e);
  } finally { 
    res.send('success');
  }
  
}