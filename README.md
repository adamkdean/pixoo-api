# Pixoo API

Pixoo API that doesn't suck.

I've based this API on a number of sources, including the [Official Pixoo API](http://doc.divoom-gz.com/web/#/12?page_id=243) (which isn't great), a bunch of open source projects, and a lot of trial and error. Please open an issue if you find any bugs.

## Install

```
npm i pixoo-api
```

## Usage

To use the PixooAPI class, you need to import it in your JavaScript file:

```js
import { PixooAPI } from 'pixoo-api'
```

Then you can create an instance of the PixooAPI class by calling the constructor with the address of the server to connect to and the size of the canvas in pixels (optional, default value is 64):

```js
const pixoo = new PixooAPI('192.168.1.100', 64)
```

Before using the instance, you should initialize it by calling the initialize method:

```js
await pixoo.initialize()
```

This will reset the push counter and send the current buffer to the server.

### Methods

The PixooAPI class has several methods that you can use to manipulate the canvas and send the updates to the server:

- `clear()`: fill the canvas with black pixels.
- `fill(color)`: fill the canvas with the given color.
- `drawPixel(x, y, color)`: draw a pixel at the given coordinates with the given color.
- `drawChar(char, position, color, font?)`: draw a character at the given position with the given color.
- `drawText(text, position, color, font?)`: draw a text on the canvas at the given coordinates with the given color.
- `drawTextCenter(text, y, color, font?)`: draw a text centered on the canvas on the given horizontal line (y) with the given color.
- `drawTextLeft(text, y, color, padding, font?)`: draw a text on the left side of the canvas on the given horizontal line (y) with the given color and padding.
- `drawTextRight(text, y, color, padding, font?)`: draw a text on the right side of the canvas on the given horizontal line (y) with the given color and padding.
- `drawRect(start, end, color, fill = false)`: draw a rectangle on the canvas between the given coordinates with the given color. If `fill` is true, the rectangle will be filled with the given color.
- `drawLine(start, end, color)`: draw a line on the canvas between the given coordinates with the given color.
- `drawImage(path, pos, size)`: draw an image on the canvas at the given position with the given size.
- `push()`: send the current buffer to the server.

You can also use the following getters to retrieve information about the canvas and the server connection:

- `buffer`: get the current pixel buffer.
- `pushCount`: get the number of times the push() method has been called.
- `pushAvgElapsed`: get the average elapsed time of the push() method in milliseconds.

There are also a number of methods that map directly to the Pixoo API, check the `lib/api.js` file for more information.

For example, to draw a red pixel at coordinates (10, 10) and send the update to the server, you can do:

```js
pixoo.drawPixel(10, 10, [255, 0, 0])
await pixoo.push()
```

## License

GNU General Public License v3.0.

See [LICENSE](LICENSE) to see the full text.

Some parts of this project are based on community projects, and comments in the code indicate the original author and the license of the original code.