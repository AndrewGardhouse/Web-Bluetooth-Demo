// Discovered through nRF Connect App
const primaryServiceUUID = 0xFF02
const candleDeviceNameUUID = 0xFFFF
const candleColourUUID = 0xFFFC
const candleEffectUUID = 0xFFFB

window.Device = new Vue({
  el: 'body',
  data: {
    device: null,
    server: null,
    batteryPercentage: '',
    deviceName: '',
    connectionStatus: 'Disconnected',
    error: '',
    red: 0,
    green: 0,
    blue: 0,
    bulbEffects: ['None', 'Candle', 'Flashing', 'Pulse', 'Rainbow', 'Rainbow Fade'],
    selectedEffect: 'None'
  },
  methods: {
    connectDevice: function() {
      this.error = ''
      navigator.bluetooth.requestDevice({
        filters: [{
          services: [primaryServiceUUID],
          optionalServices: ['battery_service']
        }]
      })
      .then((btDevice) => {
        console.log('CONECTING DEVICE')
        this.device = btDevice
        this.connectionStatus = 'Connected'
        return this.device.gatt.connect()
      })
      .then((btServer) => {
        console.log('CONECTING to server')
        this.server = btServer
      })
      .catch((err) => {
        this.error = err
        console.log(err)
      })
    },
    getDeviceName: function() {
      this.error = ''
      return this.server.getPrimaryService(primaryServiceUUID)
      .then((service) => {
        console.log('got device name service');
        return service.getCharacteristic(candleDeviceNameUUID)
      })
      .then((characteristic) => {
        console.log('got device name characteristic');
        return characteristic.readValue()
      })
      .then((value) => {
        console.log('got device name value');
        let decoder = new TextDecoder('utf-8');
        this.deviceName = decoder.decode(value);
      })
      .catch((err) => {
        this.error = err
      })
    },
    getBatteryPercentage: function() {
      this.error = ''
      return this.server.getPrimaryService(primaryServiceUUID)
      .then((service) => {
        console.log('Got Battery Service');
        return service.getCharacteristic(candleDeviceNameUUID)
      })
      .then((characteristic) => {
        console.log('Got Battery characteristic');
        return characteristic.readValue()
      })
      .then((value) => {
        console.log('Got Battery level');
        this.batteryPercentage = value.getUint8(0)
      })
      .catch((err) => {
        this.error = err
      })
    },
    changeColor: function() {
      this.error = ''

      let value
      let uuid
      let colourValue = new Uint8Array([0x00, this.red, this.green, this.blue])
      let flickerEffect = new Uint8Array([0x00, this.red, this.green, this.blue, 0x04, 0x00, 0x01, 0x00])
      let flashingEffect = new Uint8Array([0x00, this.red, this.green, this.blue, 0x00, 0x00, 0x1F, 0x00])
      let pulseEffect = new Uint8Array([0x00, this.red, this.green, this.blue, 0x01, 0x00, 0x09, 0x00])
      let rainbowEffect = new Uint8Array([0x01, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x00])
      let rainbowFadeEffect = new Uint8Array([0x01, 0x00, 0x00, 0x00, 0x03, 0x00, 0x26, 0x00])

      if (this.selectedEffect === 'None') {
        value = colourValue
        uuid = candleColourUUID
      } else {
        uuid = candleEffectUUID
        switch (this.selectedEffect) {
          case 'Candle':
            value = flickerEffect
            break
          case 'Flashing':
            value = flashingEffect
            break
          case 'Pulse':
            value = pulseEffect
            break
          case 'Rainbow':
            value = rainbowEffect
            break
          case 'Rainbow Fade':
            value = rainbowFadeEffect
            break
        }
      }

      console.log(`Red: ${this.red}`)
      console.log(`Green: ${this.green}`)
      console.log(`Blue: ${this.blue}`)
      console.log(`Effect: ${this.selectedEffect}`)

      return this.server.getPrimaryService(primaryServiceUUID)
      .then((service) => {
        return service.getCharacteristic(uuid)
      })
      .then((characteristic) => {
        return characteristic.writeValue(value)
      })
      .catch((err) => {
        this.error = err
        console.log(err)
      })
    }
  }
})
