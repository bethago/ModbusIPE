import bodyParser from 'body-parser';
import express from 'express';

import {uploadMonitoringData} from './http-agent.js';
import {monitor, writeCharging, writeDischarging} from './modbus-master.js';
import {connectClient} from "./slave-connection.js";

//check connect().then(slave => {
connectClient();
//check monitor(slave, 6000, uploadMonitoringData);

//no need for test
//monitor(6000, uploadMonitoringData);

const app = express();
const port = 3002;
app.use(bodyParser.json());

const TIME_OFFSET_MS = 0;
app.get('/time', (req, res) => {
    res.json({ utc: Date.now() });  // 밀리초 기준
});

app.post('/write', async function (req, res) {
    let tr = Date.now();
    tr = tr - TIME_OFFSET_MS;
    let chargingValue, dischargingValue, t1;
    // if (req.body["m2m:sgn"].hasOwnProperty('m2m:nev')) {
    //     if (req.body["m2m:sgn"]["m2m:nev"]["m2m:rep"]["m2m:fcnt"].hasOwnProperty('charging')) {
    //         chargingValue = Number(req.body["m2m:sgn"]["m2m:nev"]["m2m:rep"]["m2m:fcnt"]["charging"]);
    //         console.log('IF charging');
    //     }
    //     if (req.body["m2m:sgn"]["m2m:nev"]["m2m:rep"]["m2m:fcnt"].hasOwnProperty('discharging')) {
    //         dischargingValue = Number(req.body["m2m:sgn"]["m2m:nev"]["m2m:rep"]["m2m:fcnt"]["discharging"]);
    //         // t1 = Number(req.body["m2m:sgn"]["m2m:nev"]["m2m:rep"]["m2m:fcnt"]["t1"]);
    //         console.log('IF discharging');
    //     }
    // }
    if (req.body["m2m:sgn"]?.nev?.rep?.["m2m:cin"]?.con !== undefined) {
        const con = req.body["m2m:sgn"].nev.rep["m2m:cin"].con;
        const sur = req.body["m2m:sgn"].sur;
        if (sur.includes("/charging/")) {
            chargingValue = Number(con);
            console.log('IF charging');
        } else if (sur.includes("/discharging/")) {
            dischargingValue = Number(con);
            t1 = Number(req.body["m2m:sgn"].nev.rep["m2m:cin"].ct);
            console.log('IF discharging');
        }
    }

    if ((chargingValue === 0 || chargingValue === 1) && chargingValue !== undefined) {
        //check const data = await writeCharging(slave, chargingValue);
        try {
            const data = await writeCharging(chargingValue);
            console.log('charging:' + JSON.stringify(data));
        } catch (e) {
            console.log(e);
        }
    } else if ((dischargingValue === 0 || dischargingValue === 1) && dischargingValue !== undefined) {
        //check const data = await writeDischarging(slave, dischargingValue);
        try {
            const data = await writeDischarging(dischargingValue, t1, tr);
            console.log('discharging:' + JSON.stringify(data));
        } catch (e) {
            console.log(e);
        }
    }
    res.set({
        'X-M2M-RSC': '2000',
        'X-M2M-RI' : 'vrq_response',
        'Content-Type': 'application/json'
    }).status(200).send('');
});

app.post('/reconnect', async function (req, res) {
    console.log('reconnect slave req');
    connectClient();
    console.log('reconnected the slave');

    res.sendStatus(200);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

//check }).catch(e => {
//check     console.log("Could not connect to slave device", e);
//check });
