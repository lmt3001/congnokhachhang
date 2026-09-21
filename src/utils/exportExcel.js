/* ============================================================================
   Xuất .xlsx dựng lại đúng cấu trúc của CongNoKhachHang.xlsm.
   ExcelJS được nạp động để không nằm trong bundle đầu tiên.

   File xuất ra giữ CÔNG THỨC thật (F*G, H-I, SUMIF) chứ không phải giá trị
   tĩnh, nên mở bằng Excel rồi sửa số lượng thì mọi thứ tự tính lại — hệt
   workbook cũ. Riêng macro VBA thì không mang theo được vì .xlsx không chứa
   VBA; các nút bấm được thay bằng chính giao diện web này.
   ============================================================================ */

const DINH_DANG_TIEN = '#,##0'
const DINH_DANG_NGAY = 'dd/mm/yyyy'
const MAU_NHAN = 'FFB6752E' // màu nút trong workbook gốc
const MAU_DO = 'FFC00000' // màu chữ "còn nợ" của macro CapNhatTongHop

/** Kẻ tiêu đề lớn ở dòng 1 và hàng tiêu đề cột ở dòng 3, y như bản gốc. */
function dungKhung(sheet, tieuDe, cotTieuDe, soCot) {
  if (tieuDe) {
    sheet.mergeCells(1, 1, 1, soCot)
    const o = sheet.getCell(1, 1)
    o.value = tieuDe
    o.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
    o.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MAU_NHAN } }
    o.alignment = { vertical: 'middle', horizontal: 'left' }
    sheet.getRow(1).height = 26
  }

  const hang = sheet.getRow(3)
  cotTieuDe.forEach((chu, i) => {
    const o = hang.getCell(i + 1)
    o.value = chu
    o.font = { bold: true }
    o.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8ECF1' } }
    o.border = { bottom: { style: 'thin', color: { argb: 'FF94A3B8' } } }
    o.alignment = { vertical: 'middle' }
  })
  hang.commit()
}

function datDoRong(sheet, doRong) {
  doRong.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w
  })
}

/**
 * Dựng workbook từ dữ liệu. Tách riêng khỏi phần tải file để chạy được trong
 * Node (không có DOM) khi cần kiểm thử cấu trúc file xuất ra.
 */
export async function dungWorkbook({ khachHang, matHang, nhatKy, tongHop }) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Quản lý công nợ khách hàng'
  wb.created = new Date()

  // ---------------------------------------------------------------- NhatKy
  const wsNK = wb.addWorksheet('NhatKy', { views: [{ state: 'frozen', ySplit: 3 }] })
  dungKhung(
    wsNK,
    'SỔ NHẬT KÝ BÁN HÀNG - CÔNG NỢ KHÁCH HÀNG',
    ['STT', 'Ngày', 'Tên khách hàng', 'Số điện thoại', 'Mặt hàng', 'Số lượng',
     'Đơn giá', 'Thành tiền', 'Đã thanh toán', 'Còn nợ', 'Ghi chú'],
    11,
  )
  // Độ rộng lấy từ <cols> của sheet gốc.
  datDoRong(wsNK, [6.7, 12.7, 22.7, 14.7, 20.7, 10.7, 12.7, 14.7, 14.7, 14.7, 22.7])

  nhatKy.forEach((gd, i) => {
    const r = i + 4 // dữ liệu bắt đầu từ dòng 4
    const hang = wsNK.getRow(r)
    hang.getCell(1).value = i + 1
    hang.getCell(2).value = gd.ngay ? new Date(`${gd.ngay}T00:00:00`) : null
    hang.getCell(2).numFmt = DINH_DANG_NGAY
    hang.getCell(3).value = gd.ten_kh
    hang.getCell(4).value = gd.sdt ?? ''
    hang.getCell(5).value = gd.mat_hang
    hang.getCell(6).value = Number(gd.so_luong)
    hang.getCell(7).value = Number(gd.don_gia)
    hang.getCell(7).numFmt = DINH_DANG_TIEN
    // Công thức thật, không phải giá trị đã tính sẵn.
    hang.getCell(8).value = { formula: `F${r}*G${r}` }
    hang.getCell(8).numFmt = DINH_DANG_TIEN
    hang.getCell(9).value = Number(gd.da_thanh_toan)
    hang.getCell(9).numFmt = DINH_DANG_TIEN
    hang.getCell(10).value = { formula: `H${r}-I${r}` }
    hang.getCell(10).numFmt = DINH_DANG_TIEN
    hang.getCell(11).value = gd.ghi_chu ?? ''
    hang.commit()
  })

  if (nhatKy.length) {
    // Tô đỏ đậm ô còn nợ > 0 — tương ứng FormatConditions trong VBA.
    wsNK.addConditionalFormatting({
      ref: `J4:J${nhatKy.length + 3}`,
      rules: [
        {
          type: 'cellIs',
          operator: 'greaterThan',
          formulae: ['0'],
          style: { font: { bold: true, color: { argb: MAU_DO } } },
        },
      ],
    })
    wsNK.autoFilter = { from: { row: 3, column: 1 }, to: { row: nhatKy.length + 3, column: 11 } }
  }

  // --------------------------------------------------------------- TongHop
  const wsTH = wb.addWorksheet('TongHop', { views: [{ state: 'frozen', ySplit: 3 }] })
  dungKhung(
    wsTH,
    'TỔNG HỢP CÔNG NỢ THEO KHÁCH HÀNG',
    ['Tên khách hàng', 'Số điện thoại', 'Tổng tiền bán', 'Tổng đã thu', 'Còn nợ'],
    5,
  )
  datDoRong(wsTH, [22.7, 14.7, 16.7, 16.7, 16.7])

  tongHop.forEach((kh, i) => {
    const r = i + 4
    const hang = wsTH.getRow(r)
    hang.getCell(1).value = kh.ten_kh
    hang.getCell(2).value = kh.sdt ?? ''
    // SUMIF y như macro CapNhatTongHop sinh ra.
    hang.getCell(3).value = {
      formula: `SUMIF(NhatKy!$C$4:$C$10000,A${r},NhatKy!$H$4:$H$10000)`,
    }
    hang.getCell(3).numFmt = DINH_DANG_TIEN
    hang.getCell(4).value = {
      formula: `SUMIF(NhatKy!$C$4:$C$10000,A${r},NhatKy!$I$4:$I$10000)`,
    }
    hang.getCell(4).numFmt = DINH_DANG_TIEN
    hang.getCell(5).value = { formula: `C${r}-D${r}` }
    hang.getCell(5).numFmt = DINH_DANG_TIEN
    hang.commit()
  })

  if (tongHop.length) {
    wsTH.addConditionalFormatting({
      ref: `E4:E${tongHop.length + 3}`,
      rules: [
        {
          type: 'cellIs',
          operator: 'greaterThan',
          formulae: ['0'],
          style: { font: { bold: true, color: { argb: MAU_DO } } },
        },
      ],
    })
  }

  // --------------------------------------------------------------- MatHang
  const wsMH = wb.addWorksheet('MatHang')
  dungKhung(wsMH, 'DANH MỤC MẶT HÀNG', ['Tên mặt hàng', 'Đơn vị tính', 'Đơn giá'], 3)
  datDoRong(wsMH, [26.7, 14.7, 14.7])

  matHang.forEach((mh, i) => {
    const hang = wsMH.getRow(i + 4)
    hang.getCell(1).value = mh.ten
    hang.getCell(2).value = mh.dvt ?? ''
    hang.getCell(3).value = Number(mh.don_gia)
    hang.getCell(3).numFmt = DINH_DANG_TIEN
    hang.commit()
  })

  // ------------------------------------------------------------- KhachHang
  const wsKH = wb.addWorksheet('KhachHang')
  dungKhung(
    wsKH,
    'THÔNG TIN CƠ BẢN KHÁCH HÀNG',
    ['Tên khách hàng', 'Số điện thoại', 'Địa chỉ', 'Ghi chú'],
    4,
  )
  datDoRong(wsKH, [22.7, 14.7, 38.7, 22.7])

  khachHang.forEach((kh, i) => {
    const hang = wsKH.getRow(i + 4)
    hang.getCell(1).value = kh.ten
    hang.getCell(2).value = kh.sdt ?? ''
    hang.getCell(3).value = kh.dia_chi ?? ''
    hang.getCell(4).value = kh.ghi_chu ?? ''
    hang.commit()
  })

  return wb
}

/** Dựng workbook rồi tải về máy người dùng. */
export async function xuatExcel(duLieu) {
  const wb = await dungWorkbook(duLieu)
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const p = (n) => String(n).padStart(2, '0')
  const d = new Date()
  const ten = `CongNoKhachHang_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.xlsx`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = ten
  a.click()
  URL.revokeObjectURL(url)
}
