import { Builder, By, Key, until } from 'selenium-webdriver';
import { mkConfig, generateCsv, asString } from "export-to-csv";
import { writeFile } from "node:fs";
import { Buffer } from "node:buffer";
import { JSDOM } from "jsdom";

var pdata = []

async function getProductLinks() {
    const driver = await new Builder().forBrowser('chrome').build();
    // Mở trang tìm kiếm sản phẩm
    await driver.get(`https://thegioibongda.net/giay-chay-bo-pc564946.html`)
    var links = [];
    try {
        while (1) {
            // Đợi trang web load đến khi có danh sách các sản phẩm
            await driver.wait(until.elementLocated(By.xpath('//*[@id="pd_collection clearfix"]/ul')), 20000);
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const list = await driver.findElements(By.css('.tp_product_name'));
            await new Promise((resolve) => setTimeout(resolve, 2000));
            // Duyệt từng trang để lấy danh sách sản phẩm
            for (const item of list) {
                const link = await item.getAttribute('href');
                links.push(link);
            }
            try {
                await driver.findElement(By.css('.paging-next')).click();
            } catch (e) {
                console.log(e);
                break;
            }
        }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (e) { 
      console.error(`Error during product Url extraction: ${e}`);
    } finally {
      if (driver) {
        await driver.close();
      }
    }
    console.log(links);
    return links;
}

async function getProduct(links) {
    for (const link of links) 
    {
        try {
            await new Promise((resolve) => setTimeout(resolve, 100));
            await fetch(link)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                // Tạo một DOMParser với jsdom
                const dom = new JSDOM();
                const parser = new dom.window.DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                //  name
                const nameElement = doc.querySelector('h1.product-title.tp_product_detail_name');
                const name = nameElement ? nameElement.textContent.trim() : '';
                // price
                const priceElement = doc.querySelector('div.current.tp_product_detail_price');
                const price = priceElement ? priceElement.textContent.trim().split(' ')[0] : 'no';
                // SKU
                const SKUElement = doc.querySelector('span.sku');
                const skus = SKUElement.textContent.trim().split(' ')
                const sku = SKUElement ? skus[skus.length-1] : '';
                // size
                var sizes = '';
                const sizeElements = doc.querySelector('p.size.req').querySelectorAll('a');
                sizeElements.forEach(size => {
                    sizes += size.textContent.trim() + " ";                    
                })
                sizes = sizes.trim();

                // Brand
                const listsElement = doc.querySelectorAll('ul.breadcrumb > li');
                // const brandlist = listsElement[2] ? listsElement[2].textContent.trim().split(' ') : '';
                // const brand = brandlist[brandlist.length - 1];
                // Categories
                const category = listsElement[2].textContent.trim();

                // images
                const imagesElement = doc.querySelectorAll('ul.slides > li')
                var images = '';
                imagesElement.forEach(img => {
                    images += (img.getAttribute('data-src').trim() + ',');
                })
                images = images.trim(',');
                const description = doc.querySelector('blockquote')
                pdata.push({
                    SKU: sku,
                    Name: name,
                    Price: price,
                    description: description ? description.textContent : '',
                    "Attribute 1 name": 'Size',
                    "Attribute 1 value(s)": sizes,
                    brand: brand,
                    categories: category,
                    images: images, 
                })
            })

        
        }
        catch (error) {
        console.error(`Error fetching product details for ${link}:`, error);
        } 
    } 
}


(async () => {
    await (async () => {
        const links = await getProductLinks();
        for (let i = 0; i < links.length; i+= 10) {
            await getProduct(links.slice(i, i+10));
        }
    })()

    try {
        const csvConfig = mkConfig({ useKeysAsHeaders: true });
        const csv = generateCsv(csvConfig)(pdata);
        const date = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `data/giay-${1}-${date}.csv`;
        const csvBuffer = new Uint8Array(Buffer.from(asString(csv)));
        // Write the csv file to disk
        writeFile(filename, csvBuffer, (err) => {
          if (err) throw err;
          console.log("file saved: ", filename);
        }); 
    } catch (e) {
        console.log("error: ", e);
    } finally { 
        console.log("done");
    }
})();

