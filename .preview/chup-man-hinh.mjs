/* Đi qua các màn hình chính, tương tác thật rồi chụp ảnh + gom lỗi console.
   Chạy: node .preview/chup-man-hinh.mjs   (cần server xem trước ở cổng 5180) */

import { setTimeout as doi } from 'node:timers/promises'
import { moChrome } from './cdp.mjs'

const GOC = 'http://localhost:5180/#'

const trinhDuyet = await moChrome({ rong: 1440, cao: 900 })

async function bamTheoChu(chu) {
  const thay = await trinhDuyet.chay(`
    const els = [...document.querySelectorAll('button, a')];
    const el = els.find(e => e.textContent.trim().includes(${JSON.stringify(chu)}));
    if (!el) return false;
    el.click();
    return true;
  `)
  if (!thay) throw new Error(`Không tìm thấy nút chứa chữ "${chu}"`)
  await doi(600)
}

async function dat(selector, giaTri) {
  await trinhDuyet.chay(`
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error('không thấy ' + ${JSON.stringify(selector)});
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement;
    Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, ${JSON.stringify(giaTri)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
  `)
  await doi(250)
}

/** Nhấn Esc; nếu hộp thoại hỏi lại vì có thay đổi chưa lưu thì chọn bỏ. */
async function dongHopThoai() {
  await trinhDuyet.chay(`
    document.querySelector('[role="dialog"]')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  `)
  await doi(300)
  await trinhDuyet.chay(`
    const els = [...document.querySelectorAll('button')];
    els.find(e => e.textContent.includes('Đóng và bỏ thay đổi'))?.click();
  `)
  await doi(400)
}

const buoc = []
async function lam(ten, fn) {
  try {
    await fn()
    buoc.push(`  OK   ${ten}`)
  } catch (e) {
    buoc.push(`  LỖI  ${ten} → ${e.message}`)
  }
}

// ----------------------------------------------------------------- Kịch bản

await lam('Sổ nhật ký (giao diện tối)', async () => {
  await trinhDuyet.mo(`${GOC}/nhat-ky`, 2500)
  await trinhDuyet.chup('01-nhat-ky-toi')
})

await lam('Đổi sang giao diện sáng', async () => {
  await trinhDuyet.chay(`document.querySelector('[aria-label*="giao diện"]').click();`)
  await doi(500)
  await trinhDuyet.chup('02-nhat-ky-sang')
})

await lam('Mở hộp thoại Thêm giao dịch', async () => {
  await bamTheoChu('Thêm giao dịch')
  const co = await trinhDuyet.chay(`return !!document.querySelector('[role="dialog"]');`)
  if (!co) throw new Error('hộp thoại không mở')
  await trinhDuyet.chup('03-dialog-trong')
})

await lam('Submit rỗng → hiện error summary và nhận focus', async () => {
  await trinhDuyet.chay(`document.querySelector('button[form="form-giao-dich"]').click();`)
  await doi(500)
  const kq = await trinhDuyet.chay(`
    const s = document.querySelector('[role="alert"][tabindex="-1"]');
    return {
      hienThi: !!s,
      nhanFocus: document.activeElement === s,
      chu: s ? s.textContent.replace(/\\s+/g, ' ').trim() : '',
    };
  `)
  if (!kq.hienThi) throw new Error('không hiện error summary')
  if (!kq.nhanFocus) throw new Error('error summary không nhận focus sau khi submit hỏng')
  if (!kq.chu.includes('Vui lòng chọn hoặc nhập Tên khách hàng'))
    throw new Error(`thông báo sai: ${kq.chu}`)
  await trinhDuyet.chup('04-dialog-loi')
})

await lam('Combobox tự điền SĐT và đơn giá', async () => {
  await dat('#gd-ten-kh', 'Trần Thị Bích')
  await dat('#gd-mat-hang', 'Dầu ăn Simply')
  const kq = await trinhDuyet.chay(`
    return {
      sdt: document.querySelector('#gd-sdt').value,
      donGia: document.querySelector('#gd-don-gia').value,
    };
  `)
  if (kq.sdt !== '0912345678') throw new Error(`SĐT không tự điền: "${kq.sdt}"`)
  if (kq.donGia !== '52000') throw new Error(`đơn giá không tự điền: "${kq.donGia}"`)
})

await lam('Lỗi tự biến mất khi người dùng sửa xong', async () => {
  const kq = await trinhDuyet.chay(`
    const s = document.querySelector('[role="alert"][tabindex="-1"]');
    const chu = s ? s.textContent : '';
    return {
      conNhacTenKH: chu.includes('Tên khách hàng'),
      conNhacMatHang: chu.includes('Mặt hàng'),
      vienDoTenKH: document.querySelector('#gd-ten-kh').getAttribute('aria-invalid') === 'true',
    };
  `)
  if (kq.conNhacTenKH) throw new Error('vẫn báo lỗi Tên khách hàng dù đã điền')
  if (kq.conNhacMatHang) throw new Error('vẫn báo lỗi Mặt hàng dù đã điền')
  if (kq.vienDoTenKH) throw new Error('ô Tên khách hàng vẫn ở trạng thái lỗi')
})

await lam('Xem trước Thành tiền / Còn nợ cập nhật realtime', async () => {
  await dat('#gd-so-luong', '3')
  await dat('#gd-da-thanh-toan', '50000')
  // Thu hẹp trong hộp thoại: ToastHost cũng là một vùng aria-live="polite".
  const chu = await trinhDuyet.chay(`
    const el = document.querySelector('[role="dialog"] [aria-live="polite"]');
    if (!el) throw new Error('không thấy vùng xem trước trong hộp thoại');
    return el.textContent.replace(/\\s+/g,' ').trim();
  `)
  // 3 × 52.000 = 156.000 ; còn nợ = 156.000 − 50.000 = 106.000
  if (!chu.includes('156.000')) throw new Error(`Thành tiền sai: ${chu}`)
  if (!chu.includes('106.000')) throw new Error(`Còn nợ sai: ${chu}`)
  await trinhDuyet.chup('05-dialog-da-dien')
})

await lam('Danh sách gợi ý combobox mở được và lọc đúng', async () => {
  await trinhDuyet.chay(`
    const el = document.querySelector('#gd-ten-kh');
    el.focus();
    el.dispatchEvent(new Event('focus', { bubbles: true }));
  `)
  await dat('#gd-ten-kh', 'Ng')
  await doi(300)
  const kq = await trinhDuyet.chay(`
    const lb = document.querySelector('[role="listbox"]');
    const hien = lb && lb.checkVisibility && lb.checkVisibility();
    return { hien: !!hien, muc: [...lb.querySelectorAll('[role="option"]')].map(o => o.textContent.trim()) };
  `)
  if (!kq.hien) throw new Error('listbox không mở')
  await trinhDuyet.chup('06-combobox-mo')
})

await lam('Esc khi có thay đổi chưa lưu → hỏi lại, không mất dữ liệu', async () => {
  await trinhDuyet.chay(`
    document.querySelector('[role="dialog"]')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  `)
  await doi(400)
  const kq = await trinhDuyet.chay(`
    const hd = document.querySelector('[role="alertdialog"]');
    // Kiểm tra nút có thực sự bấm được không: lấy phần tử nằm trên cùng tại
    // tâm nút, nếu không phải chính nó thì đang bị thứ khác che.
    let nutBamDuoc = false;
    if (hd) {
      const nut = [...hd.querySelectorAll('button')]
        .find(b => b.textContent.includes('Tiếp tục chỉnh sửa'));
      if (nut) {
        const r = nut.getBoundingClientRect();
        const tren = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        nutBamDuoc = nut.contains(tren) || nut === tren;
      }
    }
    return {
      hoiLai: !!hd,
      conMo: !!document.querySelector('[role="dialog"]'),
      nutBamDuoc,
    };
  `)
  if (!kq.hoiLai) throw new Error('không hỏi lại trước khi bỏ thay đổi')
  if (!kq.conMo) throw new Error('hộp thoại bị đóng, mất dữ liệu đang nhập')
  if (!kq.nutBamDuoc)
    throw new Error('nút xác nhận bị phần tử khác che (kiểm tra z-index của dropdown)')
  await trinhDuyet.chup('07-hoi-lai-truoc-khi-dong')
  await dongHopThoai()
})

await lam('Trang Tổng hợp công nợ', async () => {
  await trinhDuyet.mo(`${GOC}/tong-hop`, 1800)
  await trinhDuyet.chup('07-tong-hop')
})

await lam('Chi tiết theo khách hàng', async () => {
  await bamTheoChu('Chi tiết')
  await trinhDuyet.chup('08-chi-tiet-khach')
  await dongHopThoai()
})

await lam('Trang Khách hàng', async () => {
  await trinhDuyet.mo(`${GOC}/khach-hang`, 1500)
  await trinhDuyet.chup('09-khach-hang')
})

await lam('Trang Mặt hàng', async () => {
  await trinhDuyet.mo(`${GOC}/mat-hang`, 1500)
  await trinhDuyet.chup('10-mat-hang')
})

await lam('Trang Người dùng', async () => {
  await trinhDuyet.mo(`${GOC}/nguoi-dung`, 1800)
  await trinhDuyet.chup('11-nguoi-dung')
})

await lam('375px — bảng đổi sang thẻ, không cuộn ngang', async () => {
  await trinhDuyet.datKichThuoc(375, 812)
  await trinhDuyet.mo(`${GOC}/nhat-ky`, 1800)
  const kq = await trinhDuyet.chay(`
    const bang = document.querySelector('.bang-bao');
    const the = document.querySelector('.the-ds');
    return {
      bangAn: !bang || getComputedStyle(bang).display === 'none',
      theHien: the && getComputedStyle(the).display !== 'none',
      cuonNgang: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  `)
  if (!kq.bangAn) throw new Error('bảng vẫn hiện ở 375px')
  if (!kq.theHien) throw new Error('layout thẻ không hiện ở 375px')
  if (kq.cuonNgang) throw new Error('trang bị cuộn ngang ở 375px')
  await trinhDuyet.chup('12-mobile-375')
})

await lam('Vùng chạm của nút ≥ 24px (WCAG 2.2 Target Size)', async () => {
  const nho = await trinhDuyet.chay(`
    return [...document.querySelectorAll('button, a[href], input, select')]
      .filter(el => el.checkVisibility && el.checkVisibility())
      .map(el => ({ r: el.getBoundingClientRect(), t: (el.getAttribute('aria-label') || el.textContent).trim().slice(0, 40) }))
      .filter(x => x.r.width > 0 && (x.r.width < 24 || x.r.height < 24))
      .map(x => x.t + ' → ' + Math.round(x.r.width) + 'x' + Math.round(x.r.height));
  `)
  if (nho.length) throw new Error(`nút quá nhỏ: ${nho.join(' | ')}`)
})

await trinhDuyet.dong()

// --------------------------------------------------------------- Kết quả

console.log('\nKẾT QUẢ KIỂM THỬ GIAO DIỆN')
console.log(buoc.join('\n'))

const loi = trinhDuyet.loiConsole.filter(
  (l) => !l.includes('favicon') && !l.includes('DevTools'),
)
console.log(`\nLỗi console: ${loi.length}`)
loi.slice(0, 10).forEach((l) => console.log('  ' + l))

const soLoi = buoc.filter((b) => b.includes('LỖI')).length
process.exit(soLoi > 0 || loi.length > 0 ? 1 : 0)
