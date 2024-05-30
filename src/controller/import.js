import pkg from "@woocommerce/woocommerce-rest-api";
import csv from 'csvtojson';
import fs from 'fs';

const PRODUCTS = 'products'

const WooCommerceRestApi = pkg.default;
// Đường dẫn tới tệp CSV
const csvFilePath = 'data1/Book1.csv';
// initialize woocommerce
const woo = new WooCommerceRestApi({
    url: 'https://www.donghouiters.id.vn',
    consumerKey: 'ck_691e782be3110f70ad8de11120476c34c47f2ef0',
    consumerSecret: 'cs_07b4ca6f7747cdce54319ad68387d17763c0f280',
    version: 'wc/v3',
    queryStringAuth: true
});

// Hàm chính để đọc CSV, chuyển đổi sang JSON và gửi yêu cầu đến WooCommerce
async function processCSV() {
    try {
      const jsonObj = await csv().fromFile(csvFilePath);
  
      for (const [i, value] of jsonObj.entries()) {
        try {
            // if (i == 20) {
            //     break;
            // }
            const attributes = value['Attribute 1 value(s)'].split(' ');
            // console.log(value);
            let images = await value.images.replace(/^,|,$/g, '').split(',').slice(0, 1).map((img) => {return {src: img}});
            const cate_id = parseInt(value.categories);
            const data = {
                sku: value.SKU,
                'type': 'variable',
                name: value.Name,
                regular_price: value.Price + '.00',
                description: value.description,
                attributes: [{name: value['Attribute 1 name'], options: attributes, visible: true, variation: true}],
                categories: [{id: cate_id}],
                images: images,
                weight: "180",
                manage_stock: true,
                stock_quantity: Math.floor(Math.random() * 71 + 30),
            }
            // console.log(data);
            console.log('import variant', i);
            await woo.post(PRODUCTS, data).then(async (response) => {
                let create = []
                // console.log(response.data)
                for (const val of attributes) {
                    create.push({
                        regular_price: value.Price + '.00',
                        image: {"id": response.data.images[0].id},
                        
                        weight: "180",
                        // manage_stock: true,
                        attributes: {id: response.data.attributes[0].id, options: val}})
                }
                const vdata = {
                    create: create
                }
                console.log(vdata);
                await woo.post(`products/${response.data.id}/variations/batch`, vdata).catch(err => {console.log(err.response)});
            }).catch((err) => {
                console.log(err.response.data);
            });
            await new Promise((resolve) => setTimeout(resolve, 3000));

        } catch (error) {
          console.error(error.response.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
}
  
// Gọi hàm chính
processCSV();

