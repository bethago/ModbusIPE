import {Coil, DiscreteInput, HoldingRegister, InputRegister} from './register.js'
import {monitoringRegisters, writeRegisters} from './registers-list.js'
import {client, connectClient} from "./slave-connection.js"
import fs from 'fs';
import path from 'path';

global.tcnt_t = 0;
global.SOC = 0;

let readNullCnt = -1;

//check
/*
export function monitor(slave, interval, callback) {
    setInterval(() => readRegisters(slave, callback), interval)
}
*/
export function monitor(interval, callback) {
    setInterval(() => readRegisters(callback), interval)
}

async function calculateSOC(ChargingCurrent, OpenCircuitVoltage, interval) {
    const T_samp = 100 / Math.exp(1) - 6;
    const BatteryCapacity = 288000;

    const today = new Date();
    tcnt_t += interval;
    if (tcnt_t >= T_samp) {
        try {
            if (today.getHours() == 0 && today.getMinutes() == 0 && today.getSeconds < 6) {
                var intergralCurrent = 0;
            }
            intergralCurrent += ChargingCurrent * T_samp;
            SOC += intergralCurrent / BatteryCapacity;

            tcnt_t -= T_samp;
        } catch (e) {
            // console.log(e);
        }
    }

    return SOC;
}

//check function readRegisters(slave, callback){
function readRegisters(callback) {
    let regs = {
        battery: [],
        energyGeneration: [],
        energyConsumption: []
    };
    let readValues = {
        battery: {},
        energyGeneration: {},
        energyConsumption: {}
    };

    for (let module in monitoringRegisters) {
        for (let dataPoint in monitoringRegisters[module]) {
            //check regs[module].push(createRegisterObject(dataPoint, slave, monitoringRegisters[module][dataPoint]));
            regs[module].push(createRegisterObject(dataPoint, client, monitoringRegisters[module][dataPoint]));
        }
    }
    (async () => {
        for (let module in regs) {
            for (let reg of regs[module]) {
                try {
                    const {data} = await reg.read();
                    //console.log(module + ' ' + reg.getName() + ': ' + data);
                    readValues[module][reg.getName()] = (reg.scale == null) ? data[0] : data[0] / reg.scale //TODO considers only 1st register

                    if (module == "battery") {
                        readValues[module][level] = await calculateSOC(readValues[module][current], readValues[module][voltage], 6000);
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            console.log('read ', module, ' : ', readValues[module]);

            if (JSON.stringify(readValues[module]) === '{}') {
                console.log('NULL data cnt ', readNullCnt);
                if (readNullCnt == 20) {
                    connectClient();
                    readNullCnt = -1;
                } else {
                    readNullCnt++;
                }
            } else {
                if (readNullCnt > -1) {
                    readNullCnt = -1;
                }
            }
        }
        return callback(readValues);
    })();
}

function createRegisterObject(name, slave, {type, address, length, scale}) {
    switch (type) {
        case 1:
            return new DiscreteInput(name, slave, address, length);
        case 2:
            return new Coil(name, slave, address, length);
        case 3:
            return new InputRegister(name, slave, address, length, scale);
        case 4:
            return new HoldingRegister(name, slave, address, length, scale);
        default:
            throw new Error('Not valid register type')
    }
}

//check export async function writeCharging(slave, value) {
export async function writeCharging(value) {
    //check const reg = createRegisterObject('charging', slave, writeRegisters.charging);
    const reg = createRegisterObject('charging', client, writeRegisters.charging);
    try {
        return await reg.write(value);
    } catch (e) {
        console.log(e);
    }
}

const logPath = './time_data.csv'

//check export async function writeDischarging(slave, value) {
export async function writeDischarging(value, t1) {
    //check const reg = createRegisterObject('discharging', slave, writeRegisters.discharging);
    const reg = createRegisterObject('discharging', client, writeRegisters.discharging);
    const t2 = Date.now();
    try {
        const result = await reg.write(value);
	const t3 = Date.now();
        const logLine = `${t1},${t2},${t3},${value}\n`;
        fs.appendFileSync(logPath, logLine);
        return result;
    } catch (e) {
        console.log(e);
    }
}
