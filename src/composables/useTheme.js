import { ref, watchEffect } from 'vue'

const KHOA = 'congno.theme'
const luuTru = localStorage.getItem(KHOA)

/** 'sang' | 'toi' | 'he-thong' */
export const cheDo = ref(luuTru ?? 'he-thong')

/** Giao diện tối có đang hiển thị thực tế hay không (đã tính cả 'he-thong'). */
export const dangToi = ref(false)

const truyVanToi = window.matchMedia('(prefers-color-scheme: dark)')

function apDung() {
  const toi = cheDo.value === 'toi' || (cheDo.value === 'he-thong' && truyVanToi.matches)
  dangToi.value = toi
  document.documentElement.dataset.theme = toi ? 'dark' : 'light'
}

truyVanToi.addEventListener('change', apDung)
watchEffect(() => {
  apDung()
  localStorage.setItem(KHOA, cheDo.value)
})

export function useTheme() {
  function doiCheDo() {
    // Đảo dựa trên giao diện đang hiển thị thực tế, để lần bấm đầu tiên luôn
    // tạo ra thay đổi nhìn thấy được kể cả khi đang ở chế độ 'he-thong'.
    cheDo.value = dangToi.value ? 'sang' : 'toi'
  }
  return { cheDo, dangToi, doiCheDo }
}
