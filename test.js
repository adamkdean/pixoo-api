// Copyright (C) 2022 Adam K Dean <adamkdean@googlemail.com>
// Use of this source code is governed by the GPL-3.0
// license that can be found in the LICENSE file.

import { PixooAPI } from './lib/api.js'
import { Color } from './lib/color.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  const api = new PixooAPI('192.168.1.117')
  await api.initialize()
  console.log('Initialized Pixoo API')

  // Get all settings
  // const data = await api.getAllSettings()
  // console.log('settings', data)

  // Get current channel index
  // const currentChannel = await api.getCurrentChannel()
  // console.log('currentChannel', currentChannel)

  // Random fill colors
  // while (true) {
  //   const color = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)]
  //   console.log(api.counter, 'setting color', color)
  //   api.fill(color[0], color[1], color[2])
  //   await api.push()
  // }

  // Move pixel randomly
  // let x = 32
  // let y = 32
  // while (true) {
  //   const direction = Math.floor(Math.random() * 4)
  //   switch (direction) {
  //     case 0:
  //       x++
  //       break
  //     case 1:
  //       x--
  //       break
  //     case 2:
  //       y++
  //       break
  //     case 3:
  //       y--
  //       break
  //   }

  //   api.fill(Color.Black)
  //   api.drawPixel(x, y, Color.White)
  //   // api.drawText(`Pushes: ${api.pushCount + 1}`, [0, 0], Color.White)
  //   await api.push()
  //   console.log(api.pushCount, 'pushed', api.pushAvgElapsed.toFixed(2), 'ms (avg)')
  // }

  let count = 0
  while (true) {
    const text = `(${count++})`
    console.log(`Writing text "${text}"`)
    api.clear()
    api.drawText(text, [10, 10], Color.White)
    await api.push()
    await sleep(1000)
  }
}

main()
