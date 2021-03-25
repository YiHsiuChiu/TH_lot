// Using the bleno module
var bleno = require('@abandonware/bleno');
var mqtt = require('mqtt');

const { Gpio } = require('onoff'); 
const led = new Gpio('4','out');

led.writeSync(0);

let info = {
    "mqtt": {
        "url": "mqtt://192.168.4.213:1883",
        //"url": "mqtt://test.mosquitto.org",
        "topic": {
            "getInfo": "getInfo",
            "TxGW": "car/rawTx"
        }
    },
    "contract": {
        "token": 123
    }
}

var first = true;
var client = mqtt.connect(info.mqtt.url);
client.on('connect', function () {
    console.log('---connect on mqtt---')
    client.subscribe('getToken781', { qos: 1 });
    client.subscribe('lot/tradeState', { qos: 1 })
});
client.on('message', async function (topic, message, packet) {
    if(topic == 'getToken781'){
        data = message.toString();
        console.log('get token:',data);
        info.contract.token = JSON.parse(data).token;
        console.log('info:', info);
        //client.end();
        if(first){
            await startBLE();
            first=false;
        }
    }else if(topic == 'lot/tradeState'){
        data = message.toString();
        console.log('get tradeState:',data);
        if(JSON.parse(data).message == "success"){
            console.log('success');
			led.writeSync(1);
        }else if(JSON.parse(data).message == "fail"){
            console.log('fail');
        }
    }
});

const startBLE = async => {
    // Once bleno starts, begin advertising our BLE address
    bleno.on('stateChange', function (state) {
        console.log('State change: ' + state);
        if (state === 'poweredOn') {
            bleno.startAdvertising('TH_lot', ['12ab']);
        } else {
            bleno.stopAdvertising();
        }
    });

    // Notify the console that we've accepted a connection
    bleno.on('accept', function (clientAddress) {
        console.log("Accepted connection from address: " + clientAddress);
    });

    // Notify the console that we have disconnected from a client
    bleno.on('disconnect', function (clientAddress) {
        console.log("Disconnected from address: " + clientAddress);
        var client = mqtt.connect(info.mqtt.url);
        client.on('connect', function () {
            let packet = {
                "token": info.contract.token,
            }
            client.publish('lot/redeem',JSON.stringify(packet),{ qos: 1});
            console.log('token:',info.contract.token);
            client.end();
        });
		led.writeSync(0);
    });

    // When we begin advertising, create a new service and characteristic
    bleno.on('advertisingStart', function (error) {
        if (error) {
            console.log("Advertising start error:" + error);
        } else {
            console.log("Advertising start success");
            bleno.setServices([

                // Define a new service
                new bleno.PrimaryService({
                    uuid: '12ab',
                    characteristics: [

                        // Define a new characteristic within that service
                        new bleno.Characteristic({
                            value: new Buffer(JSON.stringify(info)),
                            uuid: '34cd',
                            properties: ['read'],
                            descriptors: [
                                // see Descriptor for data type
                                new bleno.Descriptor({
                                    uuid: '56ef',
                                    value: 'get TH_lot infomation' // static value, must be of type Buffer or string if set
                                })
                            ],
                            // // Send a message back to the client with the characteristic's value
                            // onReadRequest : function(offset, callback) {
                            //     console.log("Read request received");
                            //     callback(this.RESULT_SUCCESS, this._value );
                            // }
                        })
                    ]
                })
            ]);
        }
    });
}


