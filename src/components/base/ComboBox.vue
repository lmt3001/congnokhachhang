<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue'
import { PhCaretDown, PhPlusCircle } from '@phosphor-icons/vue'
import { khoaTen } from '@/utils/format'

/**
 * Combobox cho phép gõ tự do — thay cho ComboBox của UserForm trong VBA.
 *
 * Giữ đúng hành vi của file Excel gốc: người dùng chọn từ danh sách HOẶC gõ
 * một tên hoàn toàn mới (trong sổ gốc có khách "Thọ" được gõ tay, không nằm
 * trong sheet KhachHang).
 *
 * Không dùng <datalist> vì trình duyệt không cho tạo kiểu, không báo được
 * "sẽ tạo mới", và hỗ trợ screen reader không đồng đều.
 */
const props = defineProps({
  modelValue: { type: String, default: '' },
  danhSach: { type: Array, default: () => [] }, // [{ ten, ...}]
  id: { type: String, default: '' },
  moTaBoi: { type: String, default: undefined },
  coLoi: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  /** Nhãn cho dòng gợi ý khi giá trị chưa có trong danh sách. */
  nhanTaoMoi: { type: String, default: 'Thêm mới' },
})

const emit = defineEmits(['update:modelValue', 'chon', 'blur'])

const idTuDong = useId()
const idInput = computed(() => props.id || idTuDong)
const idListbox = computed(() => `${idInput.value}-listbox`)
const idMuc = (i) => `${idInput.value}-muc-${i}`

const moListbox = ref(false)
const chiSoDangChon = ref(-1)
const oNhap = ref(null)
const danhSachEl = ref(null)

const ketQua = computed(() => {
  const k = khoaTen(props.modelValue)
  if (!k) return props.danhSach
  return props.danhSach.filter((x) => khoaTen(x.ten).includes(k))
})

/** Giá trị đang gõ chưa khớp mục nào → sẽ được tạo mới khi lưu. */
const laGiaTriMoi = computed(() => {
  const k = khoaTen(props.modelValue)
  return Boolean(k) && !props.danhSach.some((x) => khoaTen(x.ten) === k)
})

watch(
  () => props.modelValue,
  () => {
    chiSoDangChon.value = -1
  },
)

function mo() {
  if (!moListbox.value) moListbox.value = true
}

function dong() {
  moListbox.value = false
  chiSoDangChon.value = -1
}

function chon(muc) {
  emit('update:modelValue', muc.ten)
  emit('chon', muc)
  dong()
  oNhap.value?.focus()
}

async function cuonToiMuc() {
  await nextTick()
  danhSachEl.value
    ?.querySelector(`#${CSS.escape(idMuc(chiSoDangChon.value))}`)
    ?.scrollIntoView({ block: 'nearest' })
}

function diChuyen(buoc) {
  if (!moListbox.value) {
    mo()
    return
  }
  const n = ketQua.value.length
  if (n === 0) return
  chiSoDangChon.value = (chiSoDangChon.value + buoc + n) % n
  cuonToiMuc()
}

function nhanPhim(e) {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      diChuyen(1)
      break
    case 'ArrowUp':
      e.preventDefault()
      diChuyen(-1)
      break
    case 'Enter':
      // Chỉ chặn Enter khi đang thực sự chọn một mục, để Enter vẫn submit
      // được form khi danh sách đang đóng.
      if (moListbox.value && chiSoDangChon.value >= 0) {
        e.preventDefault()
        chon(ketQua.value[chiSoDangChon.value])
      } else {
        dong()
      }
      break
    case 'Escape':
      if (moListbox.value) {
        // Nuốt phím Esc để nó đóng danh sách chứ không đóng luôn hộp thoại.
        e.preventDefault()
        e.stopPropagation()
        dong()
      }
      break
    case 'Tab':
      dong()
      break
  }
}

function roiO(e) {
  // Bấm vào một mục trong danh sách cũng làm input mất focus — đừng đóng vội,
  // nếu không sự kiện click sẽ không bao giờ tới nơi.
  if (e.relatedTarget && danhSachEl.value?.contains(e.relatedTarget)) return
  dong()
  emit('blur', e)
}
</script>

<template>
  <div class="combo" @focusout="roiO">
    <div class="combo__o">
      <input
        :id="idInput"
        ref="oNhap"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        :aria-expanded="moListbox"
        :aria-controls="idListbox"
        :aria-activedescendant="chiSoDangChon >= 0 ? idMuc(chiSoDangChon) : undefined"
        :aria-invalid="coLoi || undefined"
        :aria-describedby="moTaBoi"
        :value="modelValue"
        :placeholder="placeholder"
        @input="emit('update:modelValue', $event.target.value); mo()"
        @keydown="nhanPhim"
        @focus="mo"
      />
      <button
        type="button"
        class="combo__nut"
        tabindex="-1"
        :aria-label="moListbox ? 'Đóng danh sách gợi ý' : 'Mở danh sách gợi ý'"
        @mousedown.prevent="moListbox ? dong() : (mo(), oNhap?.focus())"
      >
        <PhCaretDown :size="18" aria-hidden="true" :class="{ 'combo__nut--mo': moListbox }" />
      </button>
    </div>

    <ul v-show="moListbox" :id="idListbox" ref="danhSachEl" class="combo__ds" role="listbox">
      <li
        v-for="(muc, i) in ketQua"
        :id="idMuc(i)"
        :key="muc.id ?? muc.ten"
        role="option"
        :aria-selected="i === chiSoDangChon"
        :class="['combo__muc', { 'combo__muc--chon': i === chiSoDangChon }]"
        @mousedown.prevent="chon(muc)"
        @mousemove="chiSoDangChon = i"
      >
        <span class="combo__ten">{{ muc.ten }}</span>
        <span v-if="muc.phu" class="combo__phu">{{ muc.phu }}</span>
      </li>

      <li v-if="laGiaTriMoi" class="combo__moi" role="option" aria-selected="false" aria-disabled="true">
        <PhPlusCircle :size="16" aria-hidden="true" />
        <span>{{ nhanTaoMoi }}: <strong>{{ modelValue }}</strong></span>
      </li>

      <li v-else-if="ketQua.length === 0" class="combo__trong" role="presentation">
        Không có mục nào khớp
      </li>
    </ul>
  </div>
</template>

<style scoped>
.combo {
  position: relative;
  min-width: 0;
}

.combo__o {
  position: relative;
  display: flex;
}

/* Chừa chỗ cho nút mũi tên nằm chồng bên trong ô */
.combo__o input {
  padding-right: 40px;
}

.combo__nut {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  color: var(--color-fg-muted);
}

.combo__nut svg {
  transition: transform var(--dur-fast) var(--ease-enter);
}

.combo__nut--mo {
  transform: rotate(180deg);
}

.combo__ds {
  position: absolute;
  z-index: var(--z-drawer);
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 240px;
  overflow-y: auto;
  margin: 0;
  padding: var(--space-1);
  list-style: none;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.combo__muc {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-base);
}

.combo__muc--chon {
  background: var(--color-surface-2);
}

.combo__ten {
  overflow-wrap: anywhere;
}

.combo__phu {
  flex-shrink: 0;
  font-size: var(--text-sm);
  color: var(--color-fg-subtle);
}

.combo__moi {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
  border-top: 1px solid var(--color-border);
  margin-top: var(--space-1);
}

.combo__trong {
  padding: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-fg-subtle);
}
</style>
