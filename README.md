# hive2mqtt

A small utility to read temperature data from a Hive Heating
thermostat and post the data to an MQTT server

## Usage

Set env vars HIVE_USERNAME, HIVE_PASSWORD and MQTT_SERVER

`yarn` or `npm install` to install dependencies

Run `node server.js`

The server will post the temperature once a minute to the topic `hive/temperature`
