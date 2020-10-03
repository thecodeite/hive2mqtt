require('dotenv').config()
const fetch = require('node-fetch')
const mqtt = require('mqtt')
const cron = require('node-cron')

const conf = require('sp-conf')

const config = {
  hive: {
    username: conf.readString('HIVE_USERNAME'),
    password: conf.readPassword('HIVE_PASSWORD'),
  },
  mqtt: {
    server: conf.readString('MQTT_SERVER'),
  },
}

if (conf.missingEnvVars) {
  console.error('Some required env vars were missing. Terminating')
  process.exit(1)
}

const client = mqtt.connect(config.mqtt.server)

let sessionId = null
//run()
init()
async function init() {
  client.on('connect', function () {
    console.log('Connected')
    //run()
    cron.schedule('* * * * *', run)
    run()
    // setInterval(run, 5000)
  })
}

async function run() {
  console.log('run')
  if (!sessionId) {
    sessionId = await login(config.hive.username, config.hive.password)
  }

  if (!sessionId) {
    console.log('Could not get session ID')
    return
  }
  const result = await getNodes(sessionId)

  let targetHeatTemperature = null
  let temperature = null
  let isOn = null
  result.nodes.forEach((item) => {
    if (item.attributes.targetHeatTemperature) {
      targetHeatTemperature =
        item.attributes.targetHeatTemperature.reportedValue
    }
    if (item.attributes.temperature) {
      temperature = item.attributes.temperature.reportedValue
    }
    if (item.attributes.stateHeatingRelay) {
      isOn = item.attributes.stateHeatingRelay.reportedValue === 'ON'
    }
  })

  const message = { targetHeatTemperature, temperature, isOn }

  client.publish('hive/temperature', JSON.stringify(message))

  console.log({ message })
}

async function getNodes(sessionId) {
  const url = 'https://api-prod.bgchprod.info/omnia/nodes'
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/vnd.alertme.zoo-6.1+json',
      Accept: 'application/vnd.alertme.zoo-6.1+json',
      'X-Omnia-Client': 'Hive Web Dashboard',
      'X-Omnia-Access-Token': sessionId,
    },
  }

  const res = await fetch(url, options)
  if (res.ok) {
    return res.json()
  } else {
    sessionId = null
    throw new Error('nodes:' + res.status)
  }
}

async function login(username, password) {
  const postData = {
    username,
    password,
  }

  const url = 'https://beekeeper.hivehome.com/1.0/cognito/login'
  console.log('POST', url)
  const body = JSON.stringify(postData)
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  }

  const res = await fetch(url, options)
  if (res.ok) {
    const data = await res.json()
    // console.log('data:', data)
    return data.token
  } else {
    console.log(res.status, await res.text())
    // throw new Error('login: HTTP ' + res.status)
  }
}
