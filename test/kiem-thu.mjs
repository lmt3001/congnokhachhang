/* ============================================================================
   Kiểm thử logic thuần: định dạng / phân tích số và cấu trúc file Excel xuất ra.
   Chạy: npm test        (không cần trình duyệt, không cần Supabase)
   ============================================================================ */

import assert from 'node:assert/strict'
import test from 'node:test'
import { dungWorkbook } from '../src/utils/exportExcel.js'
import { khoaTen, ngayVN, phanTichSo, so, tien } from '../src/utils/format.js'

// ---------------------------------------------------------------- format.js

test('tien() khớp NumberFormat "#,##0" của Excel', () => {
  assert.equal(tien(250000), '250.000')
  assert.equal(tien(0), '0')
  assert.equal(tien(1234567), '1.234.567')
  assert.equal(tien(null), '0')
  assert.equal(tien('abc'), '0')
})

test('so() giữ phần thập phân cho số lượng', () => {
  assert.equal(so(10), '10')
  assert.equal(so(2.5), '2,5')
})

test('ngayVN() đổi ISO sang dd/mm/yyyy', () => {
  assert.equal(ngayVN('2026-09-21'), '21/09/2026')
  assert.equal(ngayVN(''), '')
  assert.equal(ngayVN(null), '')
})

test('phanTichSo() chấp nhận cách gõ số của người Việt', () => {
  assert.equal(phanTichSo('25000'), 25000)
  assert.equal(phanTichSo('1.200.000'), 1200000) // dấu chấm phân cách nghìn
  assert.equal(phanTichSo('2,5'), 2.5) // dấu phẩy thập phân
  assert.equal(phanTichSo(' 300 '), 300)
  assert.equal(phanTichSo(42), 42)
})

test('phanTichSo() trả NaN cho dữ liệu không phải số — tương ứng IsNumeric() của VBA', () => {
  for (const v of ['', '   ', 'abc', '12abc', null, undefined]) {
    assert.ok(Number.isNaN(phanTichSo(v)), `"${v}" phải là NaN`)
  }
})

test('khoaTen() gom nhóm như LCase(Trim()) trong macro CapNhatTongHop', () => {
  assert.equal(khoaTen('  Nguyễn Văn An '), 'nguyễn văn an')
  assert.equal(khoaTen('NGUYỄN VĂN AN'), khoaTen('nguyễn văn an'))
  assert.equal(khoaTen(null), '')
})

// ------------------------------------------------------------ exportExcel.js

const DU_LIEU = {
  khachHang: [
    { ten: 'Nguyễn Văn An', sdt: '0901234567', dia_chi: '12 Lê Lợi', ghi_chu: 'Khách quen' },
  ],
  matHang: [{ ten: 'Gạo ST25', dvt: 'kg', don_gia: 25000 }],
  nhatKy: [
    {
      ngay: '2026-09-21',
      ten_kh: 'Nguyễn Văn An',
      sdt: '0901234567',
      mat_hang: 'Gạo ST25',
      so_luong: 10,
      don_gia: 25000,
      da_thanh_toan: 100000,
      ghi_chu: '',
    },
    {
      ngay: '2026-09-22',
      ten_kh: 'Thọ',
      sdt: null,
      mat_hang: 'Nước mắm',
      so_luong: 2,
      don_gia: 45000,
      da_thanh_toan: 0,
      ghi_chu: 'Nợ',
    },
  ],
  tongHop: [
    { kh_key: 'nguyễn văn an', ten_kh: 'Nguyễn Văn An', sdt: '0901234567', tong_ban: 250000, tong_thu: 100000, con_no: 150000 },
    { kh_key: 'thọ', ten_kh: 'Thọ', sdt: null, tong_ban: 90000, tong_thu: 0, con_no: 90000 },
  ],
}

test('file xuất có đủ 4 sheet đúng tên như workbook gốc', async () => {
  const wb = await dungWorkbook(DU_LIEU)
  assert.deepEqual(
    wb.worksheets.map((w) => w.name),
    ['NhatKy', 'TongHop', 'MatHang', 'KhachHang'],
  )
})

test('NhatKy: tiêu đề dòng 1, header dòng 3, dữ liệu từ dòng 4', async () => {
  const ws = (await dungWorkbook(DU_LIEU)).getWorksheet('NhatKy')
  assert.equal(ws.getCell('A1').value, 'SỔ NHẬT KÝ BÁN HÀNG - CÔNG NỢ KHÁCH HÀNG')
  assert.equal(ws.getCell('A3').value, 'STT')
  assert.equal(ws.getCell('K3').value, 'Ghi chú')
  assert.equal(ws.getCell('A4').value, 1)
  assert.equal(ws.getCell('C4').value, 'Nguyễn Văn An')
  assert.equal(ws.getCell('C5').value, 'Thọ')
})

test('NhatKy: Thành tiền và Còn nợ là CÔNG THỨC, không phải giá trị tĩnh', async () => {
  const ws = (await dungWorkbook(DU_LIEU)).getWorksheet('NhatKy')
  // Đây là điểm mấu chốt: mở bằng Excel sửa số lượng thì mọi thứ tự tính lại.
  assert.equal(ws.getCell('H4').formula, 'F4*G4')
  assert.equal(ws.getCell('J4').formula, 'H4-I4')
  assert.equal(ws.getCell('H5').formula, 'F5*G5')
  assert.equal(ws.getCell('J5').formula, 'H5-I5')
})

test('NhatKy: định dạng số và ngày khớp bản gốc', async () => {
  const ws = (await dungWorkbook(DU_LIEU)).getWorksheet('NhatKy')
  assert.equal(ws.getCell('B4').numFmt, 'dd/mm/yyyy')
  assert.ok(ws.getCell('B4').value instanceof Date)
  for (const o of ['G4', 'H4', 'I4', 'J4']) {
    assert.equal(ws.getCell(o).numFmt, '#,##0', `${o} phải dùng #,##0`)
  }
})

test('TongHop: dùng đúng công thức SUMIF mà macro CapNhatTongHop sinh ra', async () => {
  const ws = (await dungWorkbook(DU_LIEU)).getWorksheet('TongHop')
  assert.equal(ws.getCell('C4').formula, 'SUMIF(NhatKy!$C$4:$C$10000,A4,NhatKy!$H$4:$H$10000)')
  assert.equal(ws.getCell('D4').formula, 'SUMIF(NhatKy!$C$4:$C$10000,A4,NhatKy!$I$4:$I$10000)')
  assert.equal(ws.getCell('E4').formula, 'C4-D4')
  assert.equal(ws.getCell('A4').value, 'Nguyễn Văn An')
})

test('MatHang và KhachHang giữ đúng thứ tự cột của bản gốc', async () => {
  const wb = await dungWorkbook(DU_LIEU)

  const mh = wb.getWorksheet('MatHang')
  assert.deepEqual(
    [mh.getCell('A3').value, mh.getCell('B3').value, mh.getCell('C3').value],
    ['Tên mặt hàng', 'Đơn vị tính', 'Đơn giá'],
  )
  assert.equal(mh.getCell('A4').value, 'Gạo ST25')
  assert.equal(mh.getCell('C4').value, 25000)

  const kh = wb.getWorksheet('KhachHang')
  assert.deepEqual(
    ['A3', 'B3', 'C3', 'D3'].map((o) => kh.getCell(o).value),
    ['Tên khách hàng', 'Số điện thoại', 'Địa chỉ', 'Ghi chú'],
  )
  assert.equal(kh.getCell('A1').value, 'THÔNG TIN CƠ BẢN KHÁCH HÀNG')
})

test('file xuất ghi ra được và đọc lại đúng (round-trip)', async () => {
  const wb = await dungWorkbook(DU_LIEU)
  const buffer = await wb.xlsx.writeBuffer()
  assert.ok(buffer.byteLength > 5000, 'file phải có nội dung thật')

  const { default: ExcelJS } = await import('exceljs')
  const docLai = new ExcelJS.Workbook()
  await docLai.xlsx.load(buffer)
  assert.equal(docLai.worksheets.length, 4)
  assert.equal(docLai.getWorksheet('NhatKy').getCell('H4').formula, 'F4*G4')
})

test('dữ liệu rỗng vẫn xuất được file hợp lệ', async () => {
  const wb = await dungWorkbook({ khachHang: [], matHang: [], nhatKy: [], tongHop: [] })
  const buffer = await wb.xlsx.writeBuffer()
  assert.ok(buffer.byteLength > 1000)
  assert.equal(wb.getWorksheet('NhatKy').getCell('A3').value, 'STT')
})
