import { Builder, By, Key, until } from 'selenium-webdriver';
import { mkConfig, generateCsv, asString } from "export-to-csv";
import { writeFile } from "node:fs";
import { Buffer } from "node:buffer";

async function getProductSlug(query) {
  const driver = await new Builder().forBrowser('chrome').build();
  var slugs = [];
  try {
    // Mở trang tìm kiếm sản phẩm
    await driver.get(`https://www.sendo.vn/tim-kiem?q=${query}`)
    // Đợi trang web load đến khi có danh sách các sản phẩm
    await driver.wait(until.elementLocated(By.xpath('//*[@id="main"]/div[1]/div/div[2]/div[2]/div[2]/div')), 20000);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await driver.executeScript("window.scrollTo(0, document.body.scrollHeight)");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    // Duyệt từng trang để lấy danh sách sản phẩm
    for (let i = 0; i < 8; i++) {
      await driver.findElement(By.css('button.d7ed-s0YDb1.d7ed-jQXTxb.d7ed-ZPZ4Mf.d7ed-YaJkXL.d7ed-bTLFAv')).click();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await driver.executeScript("window.scrollBy(0,200)");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    let products = await driver.findElement(By.className("d7ed-fdSIZS d7ed-OoK3wU d7ed-mPGbtR")).findElements(By.className("d7ed-d4keTB d7ed-OoK3wU"));
    await new Promise((resolve) => setTimeout(resolve, 2000));
    for (const product of products) { 
      const aTag = await product.findElement(By.css('a'));
      const href = await aTag.getAttribute("href");
      const segment = href.split('/');
      const lastsegment = segment[segment.length - 1];
      const slug = lastsegment.split(".")[0];
      slugs.push(slug);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (e) { 
    console.error(`Error during product Url extraction: ${e}`);
  } finally {
    if (driver) {
      await driver.close();
    }
  }
  return slugs;
}

export async function SendoCrawl(query, res) {
  const slugs = await getProductSlug(query);
  const pdata = [];
  for (const slug of slugs) 
  {
    try {
      const response = await fetch(`https://detail-api.sendo.vn/full/${slug}`);
      const { data } = await response.json();
      console.log(slug);
      const {
        sku_user,
        name,
        price,
        short_description,
        description_info: { description },
        category_info,
        brand_info,
        media,
        variants,
      } = data;
      
      const image_urls = await media.map((image) => image["image"]).join(", ");
      const category = await category_info.map((cat) => cat["title"]).join(", ");
      const qty = variants[0]["stock"];
      await pdata.push({
        SKU: sku_user,
        Name: name,
        Price: price,
        Short_Description: short_description,
        Description: description,
        Category: category,
        Brand: brand_info["name"],
        Images: image_urls,
        Quantity: qty,
      })
      let i = Math.round(Math.random() * 30);
      if (i === 29) {
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }
    }
    catch (error) {
      console.error(`Error fetching product details for ${slug}:`, error);
    } 
  }
  try {
    const csvConfig = mkConfig({ useKeysAsHeaders: true });
    const csv = generateCsv(csvConfig)(pdata);
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sendo-${query}-${date}.csv`;
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



