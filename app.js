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

app.post('/write', async function (req, res) {
    let tr = Date.now();
    let chargingValue, dischargingValue, t1;
    if (req.body["m2m:sgn"].hasOwnProperty('m2m:nev')) {
        if (req.body["m2m:sgn"]["m2m:nev"]["m2m:rep"]["m2m:fcnt"].hasOwnProperty('charging')) {
            chargingValue = Number(req.body["m2m:sgn"]["m2m:nev"]["m2m:rep"]["m2m:fcnt"]["charging"]);
            console.log('IF charging');
        }
        if (req.body["m2m:sgn"]["m2m:nev"]["m2m:rep"]["m2m:fcnt"].hasOwnProperty('discharging')) {
            dischargingValue = Number(req.body["m2m:sgn"]["m2m:nev"]["m2m:rep"]["m2m:fcnt"]["discharging"]);
            t1 = Number(req.body["m2m:sgn"]["m2m:nev"]["m2m:rep"]["m2m:fcnt"]["t1"]);
            console.log('IF discharging');
        }
    }

    if (chargingValue === 0 || 1 && chargingValue !== undefined) {
        //check const data = await writeCharging(slave, chargingValue);
        try {
            const data = await writeCharging(chargingValue);
            console.log('charging:' + JSON.stringify(data));
        } catch (e) {
            console.log(e);
        }
    } else if (dischargingValue === 0 || 1 && dischargingValue !== undefined) {
        //check const data = await writeDischarging(slave, dischargingValue);
        try {
            const data = await writeDischarging(dischargingValue, t1, tr);
            console.log('discharging:' + JSON.stringify(data));
        } catch (e) {
            console.log(e);
        }
    }
    res.sendStatus(200);
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
