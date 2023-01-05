// Copyright (C) 2022 Adam K Dean <adamkdean@googlemail.com>
// Use of this source code is governed by the GPL-3.0
// license that can be found in the LICENSE file.

import { PixooAPI } from './lib/api.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  const api = new PixooAPI('192.168.1.117')
  await api.initialize()
  console.log('initialized')
  await sleep(1000)

  // Get all settings
  // const data = await api.getAllSettings()
  // console.log('settings', data)

  // Get current channel index
  // const currentChannel = await api.getCurrentChannel()
  // console.log('currentChannel', currentChannel)

  while (true) {
    const color = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)]
    console.log(api.counter, 'setting color', color)
    api.fill(color[0], color[1], color[2])
    await api.push()
  }
}

main()
