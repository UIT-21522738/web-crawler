import pkg from "@woocommerce/woocommerce-rest-api";
import axios from 'axios';


const WooCommerceRestApi = pkg.default;
// initialize woocommerce
const woo = new WooCommerceRestApi({
    url: 'https://www.donghouiters.id.vn',
    consumerKey: 'ck_691e782be3110f70ad8de11120476c34c47f2ef0',
    consumerSecret: 'cs_07b4ca6f7747cdce54319ad68387d17763c0f280',
    version: 'wc/v3',
    queryStringAuth: true
});
(async () => {

    let _datas = [];
    const responses = await woo.get('products', {'per_page':  80});
    console.log(responses.data.length);
    for (const value of responses.data) { 
        await _datas.push({
            id: value.id,
            'SKU': value.sku,
            'name': value.name,
            permalink: value.permalink,
            date_created: new Date(value.date_created).getTime(),
            price: parseInt(value.price),
            category: value.categories[0].name,
            images: value.images[0].src,
            Size: value.attributes[0].options,
            description: value.description,
            total_quantity: parseInt(value.stock_quantity),
            sold_quantity: 0
        })
    }
    // lấy access token
    let data = {
        "app_id": "cli_a5fda5d27138502f",
        "app_secret": "UUF5ku27wbxk2QpW0CUjEbdqLIbzMLZV"
    };
    var access_token = '';
    await axios.post('https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal', data)
    .then(async (data) => {
        access_token = data.data.app_access_token;
        console.log(access_token);
        for (const _data of _datas) {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token,
            } 
            let app_token  = 'T4uvbvCisao02Cs9SOSlzcizg3c';
            let table_id = 'tblO08DqJReDUdQ0';
            await axios.post(`https://open.larksuite.com/open-apis/bitable/v1/apps/${app_token}/tables/${table_id}/records`, {
                fields: _data
            }, {
                headers: headers
            }).then(data => {
                console.log("success");
            }).catch(err => {console.log(err);});
        }
        
    })
    .catch(err => {
        console.log(err);
    })
})()

