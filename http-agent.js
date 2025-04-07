//import request from 'request-promise';
import axios from 'axios';
import {cseUrl, resourceConfig} from './config.js'

export async function uploadMonitoringData(data) {
    // setTimeout(() => {
    //     createAE(cseUrl, resourceConfig.AE_NAME, resourceConfig.API, resourceConfig.RR, resourceConfig.AE_ORIGIN);
    // }, 500);

    let delay = 100; // 100ms 딜레이 설정
    let count = 0;

    for (let solarModule of Object.keys(data)) {
        for (let key of Object.keys(data[solarModule])) {
            let cinURL = cseUrl + "/" + resourceConfig.AE_NAME + "/" + solarModule + "/" + key;
            console.log(`cinURL: ${cinURL}, data: ${data[solarModule][key]}`);
            setTimeout(() => {
                createCIN(cinURL, data[solarModule][key], resourceConfig.AE_ORIGIN);
            }, count * delay);

            count++;
        }
    }
}

async function createAE(url, rn, api, rr, origin) {
    let options = {
        method: 'POST',
        uri: url,
        port: 3000,
        body: {
            "m2m:ae": {
                "rn": rn,
                "api": api,
                "rr": rr
            }
        },
        headers: {
            'Accept': 'application/json',
            'X-M2M-RI': 'create_ae',
            'X-M2M-Origin': origin,
            'Content-Type': 'application/json;ty=2',
            'X-M2M-RVI': '2a'
        },
        json: true
    };
    try {
        return await request(options);
    } catch (e) {
//        console.log('AE create request error: ', e);
    }
}

async function createCNT(url, rn, origin) {
    let options = {
        method: 'POST',
        uri: url,
        port: 3000,
        body: {
            "m2m:cnt": {
                "rn": rn
            }
        },
        headers: {
            'Accept': 'application/json',
            'X-M2M-RI': 'create_cnt',
            'X-M2M-Origin': origin,
            'Content-Type': 'application/json;ty=3',
            'X-M2M-RVI': '2a'
        },
        json: true
    };
    try {
        return await request(options);
    } catch (e) {
        //console.log('CNT create request error: ', e);
    }
}

async function createCIN(url, con, origin) {
    let data = '{\n    "m2m:cin": {\n        "con": "' + con + '"\n    }\n}';

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
            'Accept': 'application/json',
            'X-M2M-RI': 'create_cin',
            'Content-Type': 'application/json;ty=4',
            'X-M2M-Origin': origin,
            'X-M2M-RVI': '2a'
        },
        data: data
    };

    await axios.request(config)
        .then((response) => {
            console.log(JSON.stringify(response.data));
        })
        .catch((error) => {
            //console.log(error);
        });
}
