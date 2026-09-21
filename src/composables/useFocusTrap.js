import { nextTick, onBeforeUnmount, watch } from 'vue'

const CHON_DUOC_FOCUS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Giữ focus bên trong hộp thoại và trả focus về đúng nơi đã mở nó.
 *
 * @param {import('vue').Ref<HTMLElement|null>} phanTu  gốc của hộp thoại
 * @param {import('vue').Ref<boolean>} dangMo
 */
export function useFocusTrap(phanTu, dangMo) {
  let phanTuTruocDo = null

  function danhSachFocus() {
    if (!phanTu.value) return []
    return Array.from(phanTu.value.querySelectorAll(CHON_DUOC_FOCUS)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    )
  }

  function xuLyTab(e) {
    if (e.key !== 'Tab') return
    const ds = danhSachFocus()
    if (ds.length === 0) {
      e.preventDefault()
      return
    }
    const dau = ds[0]
    const cuoi = ds[ds.length - 1]
    // Tab vòng lại từ phần tử cuối, Shift+Tab vòng ngược từ phần tử đầu.
    if (e.shiftKey && document.activeElement === dau) {
      e.preventDefault()
      cuoi.focus()
    } else if (!e.shiftKey && document.activeElement === cuoi) {
      e.preventDefault()
      dau.focus()
    }
  }

  function dungLai() {
    document.removeEventListener('keydown', xuLyTab, true)
    document.body.style.removeProperty('overflow')
    phanTuTruocDo?.focus?.()
    phanTuTruocDo = null
  }

  watch(
    dangMo,
    async (mo) => {
      if (mo) {
        phanTuTruocDo = document.activeElement
        document.body.style.overflow = 'hidden'
        document.addEventListener('keydown', xuLyTab, true)
        await nextTick()
        // Ưu tiên ô nhập đầu tiên; nếu không có thì focus chính hộp thoại.
        const dichDen = danhSachFocus()[0] ?? phanTu.value
        dichDen?.focus?.()
      } else if (phanTuTruocDo) {
        dungLai()
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (phanTuTruocDo) dungLai()
  })
}
