<script setup>
import { ref, useId, watch } from 'vue'
import { PhWarningCircle, PhX } from '@phosphor-icons/vue'
import { useFocusTrap } from '@/composables/useFocusTrap'

const props = defineProps({
  mo: { type: Boolean, required: true },
  tieuDe: { type: String, required: true },
  moTa: { type: String, default: '' },
  rong: { type: String, default: '560px' },
  /** Hỏi lại trước khi đóng khi form còn thay đổi chưa lưu. */
  canXacNhanDong: { type: Boolean, default: false },
})

const emit = defineEmits(['dong'])

const hopThoai = ref(null)
const idTieuDe = useId()
const idMoTa = useId()
const idHoiLai = useId()
const hoiLai = ref(false)

useFocusTrap(hopThoai, () => props.mo)

watch(
  () => props.mo,
  (mo) => {
    if (!mo) hoiLai.value = false
  },
)

function yeuCauDong() {
  // Dùng lớp xác nhận ngay trong hộp thoại thay vì window.confirm: giữ được
  // focus bên trong, đồng bộ với phần còn lại của app, và không chặn luồng.
  if (props.canXacNhanDong) {
    hoiLai.value = true
    return
  }
  emit('dong')
}

function nhanPhim(e) {
  if (e.key !== 'Escape') return
  e.stopPropagation()
  // Esc lần đầu mở lớp xác nhận, Esc lần hai quay lại chỉnh sửa tiếp —
  // không bao giờ làm mất dữ liệu chỉ vì lỡ tay.
  if (hoiLai.value) hoiLai.value = false
  else yeuCauDong()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="lop-phu">
      <div v-if="mo" class="lop-phu" @mousedown.self="yeuCauDong">
        <Transition name="hop" appear>
          <div
            ref="hopThoai"
            class="hop"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="idTieuDe"
            :aria-describedby="moTa ? idMoTa : undefined"
            :style="{ maxWidth: rong }"
            tabindex="-1"
            @keydown="nhanPhim"
          >
            <header class="hop__dau">
              <div>
                <h2 :id="idTieuDe" class="hop__tieu-de">{{ tieuDe }}</h2>
                <p v-if="moTa" :id="idMoTa" class="hop__mo-ta">{{ moTa }}</p>
              </div>
              <button type="button" class="hop__dong" aria-label="Đóng hộp thoại" @click="yeuCauDong">
                <PhX :size="20" aria-hidden="true" />
              </button>
            </header>

            <div class="hop__than">
              <slot />
            </div>

            <footer v-if="$slots.chan" class="hop__chan">
              <slot name="chan" />
            </footer>

            <!-- Lớp xác nhận khi đóng lúc còn thay đổi chưa lưu -->
            <div v-if="hoiLai" class="hoi-lai" role="alertdialog" :aria-labelledby="idHoiLai">
              <div class="hoi-lai__hop">
                <PhWarningCircle :size="28" weight="fill" aria-hidden="true" class="hoi-lai__icon" />
                <p :id="idHoiLai" class="hoi-lai__chu">
                  Bạn có thay đổi chưa lưu. Đóng lại bây giờ sẽ mất những gì vừa nhập.
                </p>
                <div class="hoi-lai__nut">
                  <button type="button" class="hoi-lai__tiep" @click="hoiLai = false">
                    Tiếp tục chỉnh sửa
                  </button>
                  <button type="button" class="hoi-lai__bo" @click="emit('dong')">
                    Đóng và bỏ thay đổi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lop-phu {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: var(--space-4);
  /* Làm mờ nền để báo hiệu "bấm ra ngoài là đóng", không phải để trang trí */
  background: var(--color-scrim);
  backdrop-filter: blur(3px);
}

@media (min-width: 640px) {
  .lop-phu {
    align-items: center;
  }
}

.hop {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100dvh - var(--space-8));
  background: var(--color-surface);
  color: var(--color-fg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.hop__dau {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.hop__tieu-de {
  font-size: var(--text-lg);
}

.hop__mo-ta {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}

.hop__dong {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  color: var(--color-fg-muted);
  transition: background-color var(--dur-fast) var(--ease-enter);
}

.hop__dong:hover {
  background: var(--color-surface-hover);
  color: var(--color-fg);
}

.hop__than {
  padding: var(--space-5);
  overflow-y: auto;
}

.hop__chan {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
}

/* --- Lớp xác nhận bỏ thay đổi --- */
.hoi-lai {
  position: absolute;
  inset: 0;
  /* Phải nằm trên danh sách gợi ý của ComboBox (--z-drawer), nếu không
     dropdown đang mở sẽ che mất hai nút lựa chọn. */
  z-index: var(--z-modal);
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background: var(--color-scrim);
  backdrop-filter: blur(2px);
}

.hoi-lai__hop {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-3);
  max-width: 380px;
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.hoi-lai__icon {
  color: var(--color-warning);
}

.hoi-lai__chu {
  font-size: var(--text-sm);
  color: var(--color-fg);
}

.hoi-lai__nut {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-1);
}

.hoi-lai__tiep,
.hoi-lai__bo {
  min-height: 44px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
}

/* Lựa chọn an toàn là mặc định và nổi bật hơn */
.hoi-lai__tiep {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.hoi-lai__bo {
  color: var(--color-danger-fg);
  border: 1px solid var(--color-danger);
}

.hoi-lai__bo:hover {
  background: var(--color-danger-subtle);
}

/* Chỉ animate transform và opacity để không gây reflow.
   Thoát nhanh hơn vào (120ms / 180ms) cho cảm giác phản hồi tức thì. */
.lop-phu-enter-active {
  transition: opacity var(--dur-base) var(--ease-enter);
}
.lop-phu-leave-active {
  transition: opacity var(--dur-exit) var(--ease-exit);
}
.lop-phu-enter-from,
.lop-phu-leave-to {
  opacity: 0;
}

.hop-enter-active {
  transition:
    transform var(--dur-base) var(--ease-enter),
    opacity var(--dur-base) var(--ease-enter);
}
.hop-leave-active {
  transition:
    transform var(--dur-exit) var(--ease-exit),
    opacity var(--dur-exit) var(--ease-exit);
}
.hop-enter-from,
.hop-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(8px);
}
</style>
