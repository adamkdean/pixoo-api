// Copyright (C) 2022 Adam K Dean <adamkdean@googlemail.com>
// Use of this source code is governed by the GPL-3.0
// license that can be found in the LICENSE file.

// Note: this is based on the documentation at http://doc.divoom-gz.com/web/#/12?page_id=220
// which is not the greatest documentation in the world. I've tried to make the methods
// easy to understand and use, but you may need to experiment to get the right values.
// - AKD, Jan 2023.

import sharp from 'sharp'
import superagent from 'superagent'
import { Color } from './color.js'
import { Font } from './fonts.js'

export class PixooAPI {
  constructor(address, size = 64) {
    this.url = `http://${address}`
    this.size = size
    this.pixelCount = size * size
    this.buffer = new Array(this.pixelCount).fill([0, 0, 0])
    this.pushCount = 0
    this.pushAvgElapsed = 0
  }

  async initialize() {
    await this.resetCounter()
    await this.push()
  }

  //
  // Internal methods
  //
  async post(data) {
    const response = await superagent.post(`${this.url}/post`).send(data)
    if (response.status !== 200) throw new Error(`Unexpected status code: ${response.status}`)
    const body = this.parseJson(response.text)
    if (typeof body === 'object' && body.error_code !== 0) throw new Error(body.error_code)
    return body
  }

  parseJson(data) {
    try {
      return JSON.parse(data)
    } catch (e) {
      return data
    }
  }

  //
  // Helper methods
  //
  clear() {
    this.fill(Color.Black)
  }

  parseColor(color) {
    if (typeof color === 'string') return this.hexToRgb(color)
    if (Array.isArray(color) && color.length === 3) return color
    throw new Error(`Invalid color: ${color}`)
  }

  hexToRgb(hex) {
    if (hex[0] === '#') hex = hex.slice(1)
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return [r, g, b]
  }

  // @color: [r, g, b]
  fill(color) {
    this.buffer = new Array(this.pixelCount).fill(this.parseColor(color))
  }

  drawPixel(x, y, color) {
    if (x < 0 || y < 0) return
    if (x >= this.size || y >= this.size) return
    this.buffer[x + y * this.size] = this.parseColor(color)
  }

  getTextWidth(text, font = Font.Vari8) {
    return [...text].reduce((acc, c) => {
      if (!font[c]) c = '?' // unknown character
      const width = Math.floor(font[c].length / 5)
      return acc + width + 1
    }, 0)
  }

  // @y: horizontal line to draw text on (from top pixel)
  // @color: [r, g, b]
  // @font: font to use
  // Caveat: due to the way the font is rendered, the text will be slightly
  // offset from the center of the screen to the left (by 1 pixel.)
  drawTextCenter(text, y, color = Color.White, font = Font.Vari8) {
    let pixelSoFar = 0
    const x = Math.floor((this.size - this.getTextWidth(text, font)) / 2)
    const chars = [...text]
    chars.map((c, i) => {
      if (!font[c]) c = '?'
      const width = Math.floor(font[c].length / 5)
      this.drawChar(c, [x + pixelSoFar, y], this.parseColor(color), font)
      pixelSoFar += width + 1
    })
  }

  // @y: horizontal line to draw text on (from top pixel)
  // @color: [r, g, b]
  // @padding: number of pixels to pad the text on the left and right sides
  // @font: font to use
  drawTextRight(text, y, color = Color.White, padding = 0, font = Font.Vari8) {
    let pixelSoFar = 0
    const x = this.size - this.getTextWidth(text, font) - padding
    const chars = [...text]
    chars.map((c, i) => {
      if (!font[c]) c = '?'
      const width = Math.floor(font[c].length / 5)
      this.drawChar(c, [x + pixelSoFar, y], this.parseColor(color), font)
      pixelSoFar += width + 1
    })
  }

  // @y: horizontal line to draw text on (from top pixel)
  // @color: [r, g, b]
  // @padding: number of pixels to pad the text on the left and right sides
  // @font: font to use
  drawTextLeft(text, y, color = Color.White, padding = 0, font = Font.Vari8) {
    let pixelSoFar = 0
    const chars = [...text]
    chars.map((c, i) => {
      if (!font[c]) c = '?'
      const width = Math.floor(font[c].length / 5)
      this.drawChar(c, [padding + pixelSoFar, y], this.parseColor(color), font)
      pixelSoFar += width + 1
    })
  }

  // Adapted from https://github.com/C453/Pixoo-TS (Apache 2.0)
  drawText(text, pos, color = Color.White, font = Font.Vari8) {
    let pixelSoFar = 0
    const chars = [...text]
    chars.map((c, i) => {
      if (!font[c]) c = '?'
      const width = Math.floor(font[c].length / 5)
      this.drawChar(c, [pixelSoFar + pos[0], pos[1]], this.parseColor(color), font)
      pixelSoFar += width + 1
    })
  }

  // Adapted from https://github.com/C453/Pixoo-TS (Apache 2.0)
  drawChar(char, pos, color, font = Font.Vari8) {
    const charMatrix = font[char]
    if (!charMatrix) {
      console.log(`Unknown char: ${char}`)
      charMatrix = font['?'] // default to ?
    }
    const width = Math.floor(charMatrix.length / 5)
    charMatrix.forEach((bit, index) => {
      if (bit === 1) {
        const x = index % width
        const y = Math.floor(index / width)
        this.drawPixel(pos[0] + x, pos[1] + y, this.parseColor(color))
      }
    })
  }

  // Co-pilot authored method
  // @start: [x, y]
  // @end: [x, y]
  // @color: [r, g, b]
  // @fill: boolean
  drawRect(start, end, color, fill = false) {
    if (fill) {
      for (let x = start[0]; x < end[0]; x++) {
        for (let y = start[1]; y < end[1]; y++) {
          this.drawPixel(x, y, this.parseColor(color))
        }
      }
    } else {
      for (let x = start[0]; x < end[0]; x++) {
        for (let y = start[1]; y < end[1]; y++) {
          if (x === start[0] || y === start[1] || x === end[0] - 1 || y === end[1] - 1) {
            this.drawPixel(x, y, this.parseColor(color))
          }
        }
      }
    }
  }

  // Co-pilot authored method
  // @start: [x, y]
  // @end: [x, y]
  // @color: [r, g, b]
  drawLine(start, end, color) {
    const dx = Math.abs(end[0] - start[0])
    const dy = Math.abs(end[1] - start[1])
    const sx = start[0] < end[0] ? 1 : -1
    const sy = start[1] < end[1] ? 1 : -1
    let err = dx - dy
    while (true) {
      this.drawPixel(start[0], start[1], this.parseColor(color))
      if (start[0] === end[0] && start[1] === end[1]) break
      const e2 = 2 * err
      if (e2 > -dy) {
        err -= dy
        start[0] += sx
      }
      if (e2 < dx) {
        err += dx
        start[1] += sy
      }
    }
  }

  async drawImage(path, pos, size) {
    const image = sharp(path)

    // Resize the image to fit the given size
    const resizedImage = image.resize(size[0], size[1])
    const imageData = await resizedImage.raw().toBuffer()
    const metadata = await image.metadata()
    const pixelSize = metadata.format === 'png' ? 4 : 3

    // Iterate over each pixel in the image and draw it on the display
    for (let y = 0; y < size[1]; y++) {
      for (let x = 0; x < size[0]; x++) {
        const pixelIndex = (y * size[0] + x) * pixelSize
        const r = imageData[pixelIndex]
        const g = imageData[pixelIndex + 1]
        const b = imageData[pixelIndex + 2]
        const color = [r, g, b]
        this.drawPixel(pos[0] + x, pos[1] + y, this.parseColor(color))
      }
    }
  }

  async push() {
    await this.sendBuffer()
  }

  async sendBuffer() {
    if (this.counter >= 1000) await this.resetCounter()

    const start = Date.now()
    const response = await this.sendHttpGif(
      1, // PicNum
      this.size, // PicWidth
      0, // PicOffset
      this.counter++, // PicID
      1000, // PicSpeed
      Buffer.from(this.buffer.flat()).toString('base64') // PicData
    )
    this.pushAvgElapsed = (this.pushAvgElapsed * this.pushCount + (Date.now() - start)) / (this.pushCount + 1)
    this.pushCount++
    return response
  }

  async resetCounter() {
    this.counter = 0
    return await this.resetHttpGifId()
  }

  //
  // Pixoo API methods
  //
  async getCurrentChannel() {
    return this.post({
      Command: 'Channel/GetIndex'
    })
  }

  // @index: 0 (Faces), 1 (Cloud Channel), 2 (Visualizer), 3 (Custom), 4 (Black screen)
  async setChannel(index) {
    return this.post({
      Command: 'Channel/SetIndex',
      SelectIndex: index
    })
  }

  // @index: 0-2
  async setCustomPageIndex(index) {
    return this.post({
      Command: 'Channel/SetCustomPageIndex',
      CustomPageIndex: index
    })
  }

  // @eqPosition: index starts from 0
  async setVisualizerChannel(index) {
    return this.post({
      Command: 'Channel/SetEqPosition',
      EqPosition: index
    })
  }

  // @index: 0 (Recommend gallery), 1 (Favourite), 2 (Subscribe artist), 3 (Album)
  async setCloudIndex(index) {
    return this.post({
      Command: 'Channel/CloudIndex',
      Index: index
    })
  }

  // @brightness: 0-100
  async setBrightness(brightness) {
    return this.post({
      Command: 'Channel/SetBrightness',
      Brightness: brightness
    })
  }

  async getAllSettings() {
    return this.post({
      Command: 'Channel/GetAllConf'
    })
  }

  // @longitude: -180 to 180
  // @latitude: -90 to 90
  async setLogAndLat(longitude, latitude) {
    return this.post({
      Command: 'Sys/LogAndLat',
      Longitude: longitude,
      Latitude: latitude
    })
  }

  // @timeZoneValue: time zone value (string, e.g. GMT-5)
  async setTimeZone(timeZoneValue) {
    return this.post({
      Command: 'Sys/TimeZone',
      TimeZoneValue: timeZoneValue
    })
  }

  // "it will set the system time when the device powers on"
  // @utc: timestamp (e.g. 1672416000)
  async setSystemTime(utc) {
    return this.post({
      Command: 'Device/SetUTC',
      Utc: utc
    })
  }

  // @onOff: 0 (off), 1 (on)
  async setOnOffScreen(onOff) {
    return this.post({
      Command: 'Channel/OnOffScreen',
      OnOff: onOff
    })
  }

  async getDeviceTime() {
    return this.post({
      Command: 'Device/GetDeviceTime'
    })
  }

  // @mode: 0 (Celsius), 1 (Fahrenheit)
  async setDisTempMode(mode) {
    return this.post({
      Command: 'Device/SetDisTempMode',
      Mode: mode
    })
  }

  // @mode: 0 (normal), 1 (90), 2 (180), 3 (270)
  async setScreenRotationAngle(mode) {
    return this.post({
      Command: 'Device/SetScreenRotationAngle',
      Mode: mode
    })
  }

  // @mode: 0 (off), 1 (on)
  async setMirrorMode(mode) {
    return this.post({
      Command: 'Device/SetMirrorMode',
      Mode: mode
    })
  }

  // @mode: 0 (12-hour), 1 (24-hour)
  async setTime24Flag(mode) {
    return this.post({
      Command: 'Device/SetTime24Flag',
      Mode: mode
    })
  }

  // @mode: 0 (off), 1 (on)
  async setHighLightMode(mode) {
    return this.post({
      Command: 'Device/SetHighLightMode',
      Mode: mode
    })
  }

  // @rValue: 0-100
  // @gValue: 0-100
  // @bValue: 0-100
  async setWhiteBalance(rValue, gValue, bValue) {
    return this.post({
      Command: 'Device/SetWhiteBalance',
      RValue: rValue,
      GValue: gValue,
      BValue: bValue
    })
  }

  async getWeatherInfo() {
    return this.post({
      Command: 'Device/GetWeatherInfo'
    })
  }

  // @minute: 0-59
  // @second: 0-59
  // @status: 0 (stop), 1 (start)
  async setTimer(minute, second, status) {
    return this.post({
      Command: 'Tools/SetTimer',
      Minute: minute,
      Second: second,
      Status: status
    })
  }

  // @status: 0 (stop), 1 (start), 2 (reset)
  async setStopWatch(status) {
    return this.post({
      Command: 'Tools/SetStopWatch',
      Status: status
    })
  }

  // @blueScore: 0-999
  // @redScore: 0-999
  async setScoreBoard(blueScore, redScore) {
    return this.post({
      Command: 'Tools/SetScoreBoard',
      BlueScore: blueScore,
      RedScore: redScore
    })
  }

  // @status: 0 (off), 1 (on)
  async setNoiseStatus(status) {
    return this.post({
      Command: 'Tools/SetNoiseStatus',
      NoiseStatus: status
    })
  }

  // "play gif file, the command can select the gif file,
  // the folder which includes gif files, and the net gif file.
  // the gif files only support the size (1616 ,32 32 ,64 * 64)."
  //
  // @fileType: 0 (play tf’s file), 1 (play tf’s folder), 2 (play net file)
  // @fileName: 2 (net file address), 1 (the folder path), 0 (the file path)
  async playTFGif(fileType, fileName) {
    return this.post({
      Command: 'Device/PlayTFGif',
      FileType: fileType,
      FileName: fileName
    })
  }

  // "get the PicId which the command Draw/SendHttpGif.
  // It will return the PicId, it’s value is the previous gif id plus 1"
  async GetHttpGifId() {
    return this.post({
      Command: 'Device/GetHttpGifId'
    })
  }

  async resetHttpGifId() {
    return this.post({
      Command: 'Draw/ResetHttpGifId'
    })
  }

  // See http://doc.divoom-gz.com/web/#/12?page_id=93
  //
  // Command	string	Draw/SendHttpGif
  // PicNum	number	the include single pictures of the animation and smaller than 60
  // PicWidth	number	the pixels of the animation, and only support the 16,32,64
  // PicOffset	number	the picture offset start from 0. eg:0,1,2,3,4,PicNum-1
  // PicID	number	the animation ID, every animation must have unique ID and auto increase,It’s getting bigger and start with 1, example: the current gif id is 100, and then next gif’s id should be greater than or equal to 101
  // PicSpeed	number	the animation speed, it bases on ms
  // PicData	string	the picutre Base64 encoded RGB data, The RGB data is left to right and up to down
  async sendHttpGif(picNum, picWidth, picOffset, picId, picSpeed, picData) {
    return this.post({
      Command: 'Draw/SendHttpGif',
      PicNum: picNum,
      PicWidth: picWidth,
      PicOffset: picOffset,
      PicID: picId,
      PicSpeed: picSpeed,
      PicData: picData
    })
  }

  // See http://doc.divoom-gz.com/web/#/12?page_id=219
  async clearHttpText() {
    return this.post({
      Command: 'Draw/ClearHttpText'
    })
  }

  // See http://doc.divoom-gz.com/web/#/12?page_id=234
  //
  // Command	string	Draw/SendHttpItemList
  // ItemList	array	item list
  // TextId	number	the text id is unique and will be replaced with the same ID， it is samller than 40
  // type	number	the display type， It will be introduced below
  // x	number	the start x postion
  // y	number	the start y postion
  // dir	number	0:scroll left, 1:scroll right
  // font	number	it is font id via https://app.divoom-gz.com/Device/GetTimeDialFontList, you shold select the font with Type=0 if you hope it to scrool
  // TextWidth	number	the text area width
  // Textheight	number	the text area height
  // TextString	string	the text string is utf8 string and lenght is smaller than 512 , it will be display string or request url string， it is Optional
  // speed	number	the scroll speed if it need scroll, the time (ms) the text move one step
  // color	string	the font color, eg:#FFFF00
  // update_time	number	the url request interval time based on seconds， it is Optional
  // align	number	horizontal text alignment, 1:left; 2: middle; 3:right
  async sendHttpItemList(itemList) {
    return this.post({
      Command: 'Draw/SendHttpItemList',
      ItemList: itemList
    })
  }

  // See http://doc.divoom-gz.com/web/#/12?page_id=347
  //
  // Command	string	Device/PlayBuzzer
  // ActiveTimeInCycle	number	Working time of buzzer in one cycle in milliseconds
  // OffTimeInCycle	number	Idle time of buzzer in one cycle in milliseconds
  // PlayTotalTime	number	Working total time of buzzer in milliseconds
  async playBuzzer(activeTimeInCycle, offTimeInCycle, playTotalTime) {
    return this.post({
      Command: 'Device/PlayBuzzer',
      ActiveTimeInCycle: activeTimeInCycle,
      OffTimeInCycle: offTimeInCycle,
      PlayTotalTime: playTotalTime
    })
  }

  // play divoom gif file, it will get from “Get Img Upload List” and “Get My Like Img List”.
  // See http://doc.divoom-gz.com/web/#/12?page_id=460
  async playRemote(fileId) {
    return this.post({
      Command: 'Draw/SendRemote',
      FileId: fileId
    })
  }

  // CommandList will run all commmand of the the command array.
  // See http://doc.divoom-gz.com/web/#/12?page_id=241
  //
  // Command	string	Draw/CommandList
  // CommandList	Array	the command array information
  async commandList(commandList) {
    return this.post({
      Command: 'Draw/CommandList',
      CommandList: commandList
    })
  }

  // UseHTTPCommandSource will run all commmands in url file.
  // See http://doc.divoom-gz.com/web/#/12?page_id=242
  //
  // Command	string	Draw/UseHTTPCommandSource
  // CommandUrl	string	the url address of the command array information
  async useHTTPCommandSource(commandUrl) {
    return this.post({
      Command: 'Draw/UseHTTPCommandSource',
      CommandUrl: commandUrl
    })
  }
}