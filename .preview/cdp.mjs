/* Trình điều khiển Chrome tối giản qua DevTools Protocol.
   Dùng WebSocket có sẵn của Node 22 nên không cần cài thêm gói nào.
   CHỈ phục vụ kiểm thử giao diện, không nằm trong bản build sản phẩm.       */

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { setTimeout as doi } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CONG = 9333
const THU_MUC_ANH = new URL('../.shots/', import.meta.url)

export async function moChrome({ rong = 1440, cao = 900 } = {}) {
  const tienTrinh = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--no-first-run',
      '--force-color-profile=srgb',
      '--hide-scrollbars',
      `--remote-debugging-port=${CONG}`,
      `--window-size=${rong},${cao}`,
      '--user-data-dir=' + process.env.TEMP + '\\cdp-profile-congno',
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  let muc
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${CONG}/json/list`)
      const ds = await r.json()
      muc = ds.find((t) => t.type === 'page')
      if (muc) break
    } catch {
      /* chrome chưa sẵn sàng */
    }
    await doi(250)
  }
  if (!muc) throw new Error('Không kết nối được Chrome qua CDP')

  const ws = new WebSocket(muc.webSocketDebuggerUrl)
  await new Promise((ok, loi) => {
    ws.onopen = ok
    ws.onerror = loi
  })

  let id = 0
  const dangCho = new Map()
  const loiConsole = []

  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && dangCho.has(m.id)) {
      const { ok, loi } = dangCho.get(m.id)
      dangCho.delete(m.id)
      m.error ? loi(new Error(JSON.stringify(m.error))) : ok(m.result)
      return
    }
    if (m.method === 'Runtime.exceptionThrown') {
      loiConsole.push(m.params.exceptionDetails.exception?.description ?? 'ngoại lệ không rõ')
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      loiConsole.push(m.params.args.map((a) => a.value ?? a.description).join(' '))
    }
  }

  const goi = (method, params = {}) =>
    new Promise((ok, loi) => {
      const n = ++id
      dangCho.set(n, { ok, loi })
      ws.send(JSON.stringify({ id: n, method, params }))
    })

  await goi('Page.enable')
  await goi('Runtime.enable')

  return {
    loiConsole,

    async mo(url, chodoi = 1800) {
      await goi('Page.navigate', { url })
      await doi(chodoi)
    },

    /** Chạy JS trong trang; ném lỗi nếu biểu thức ném. */
    async chay(bieuThuc) {
      const r = await goi('Runtime.evaluate', {
        expression: `(function(){${bieuThuc}})()`,
        returnByValue: true,
        awaitPromise: true,
      })
      if (r.exceptionDetails) {
        throw new Error(r.exceptionDetails.exception?.description ?? 'lỗi khi chạy JS')
      }
      return r.result.value
    },

    /** Đổi kích thước khung nhìn để kiểm tra responsive. */
    async datKichThuoc(rong, cao) {
      await goi('Emulation.setDeviceMetricsOverride', {
        width: rong,
        height: cao,
        deviceScaleFactor: 1,
        mobile: rong < 768,
      })
      await doi(300)
    },

    async chup(ten) {
      mkdirSync(THU_MUC_ANH, { recursive: true })
      const { data } = await goi('Page.captureScreenshot', { format: 'png' })
      writeFileSync(new URL(`${ten}.png`, THU_MUC_ANH), Buffer.from(data, 'base64'))
    },

    async dong() {
      ws.close()
      tienTrinh.kill()
    },
  }
}
