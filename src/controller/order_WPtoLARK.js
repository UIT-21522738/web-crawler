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
    // dữ liệu order
    let o_datas = [];
    // dữ liệu order details
    let do_datas = [];
    // lấy dữ liệu order
    const responses = await woo.get('orders');
    // duyệt dữ liệu trả về 
    for (const value of responses.data) { 
        await o_datas.push({
            'ID': parseInt(value.id),
            'Tên khách hàng': value.billing.first_name + ' ' + value.billing.last_name,
            'Địa chỉ': value.shipping.address_1 + ', ' + value.shipping.city + ', ' + value.shipping.state + ' ' + value.shipping.country,
            'Ngày tạo': new Date(value.date_created).getTime(),
            'Tổng số tiền': parseInt(value.total),
            'Trạng thái': value.status,
        });

        await do_datas.push(value.line_items);
    }
    // lấy access token
    let data = {
        "app_id": "cli_a5fda5d27138502f",
        "app_secret": "UUF5ku27wbxk2QpW0CUjEbdqLIbzMLZV"
    };
    var access_token = '';
    // lấy app_access_token
    await axios.post('https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal', data)
    .then(async (data) => {
        access_token = data.data.app_access_token;
        for (const [i, _data] of o_datas.entries()) {
            console.log(i);
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token,
            } 
            let app_token  = 'T4uvbvCisao02Cs9SOSlzcizg3c';
            let table_id = 'tblZLNAYw86usum7';
            // Tạo order
            await axios.post(`https://open.larksuite.com/open-apis/bitable/v1/apps/T4uvbvCisao02Cs9SOSlzcizg3c/tables/tblsJbJFLu4yNA0L/records`, {
                fields: _data
            }, {
                headers: headers
            }).then(async data => {
                for (const product of do_datas[i]) {
                    // search sku record id
                    await axios.post("https://open.larksuite.com/open-apis/bitable/v1/apps/T4uvbvCisao02Cs9SOSlzcizg3c/tables/tblO08DqJReDUdQ0/records/search", {
                        
                            "filter": {
                                "conjunction": "and",
                                "conditions": [
                                    {
                                        "field_name": "SKU",
                                        "operator": "is",
                                        "value": [
                                            product.sku
                                            // "P1GD243460"
                                        ]
                                    }
                                ]
                            }
                        
                    }, {
                        headers: headers
                    }).then(async sku_data => {
                        console.log(data.data.data.record.record_id)
                        let table_id = 'tblUxmxHDi7C5kSP';
                        // tạo order details
                        await axios.post(`https://open.larksuite.com/open-apis/bitable/v1/apps/T4uvbvCisao02Cs9SOSlzcizg3c/tables/tblAcs6lFf2yFzlx/records`, {
                            fields: {
                                "Mã đơn hàng": [data.data.data.record.record_id],
                                "SKU": [sku_data.data.data.items[0].record_id],
                                'Số lượng': parseInt(product.quantity)
                            }
                        }, {
                            headers: headers
                        }).then(function (data) {console.log(data.data)});
                    })
                }
                console.log("success");
            }).catch(err => {console.log(err);});
        }
        
    })
    .catch(err => {
        console.log(err);
    })
})()

