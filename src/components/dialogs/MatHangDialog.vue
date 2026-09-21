<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useCongNoStore } from '@/stores/congNoStore'
import { useToast } from '@/composables/useToast'
import { khoaTen, phanTichSo } from '@/utils/format'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseField from '@/components/base/BaseField.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ErrorSummary from '@/components/base/ErrorSummary.vue'

const props = defineProps({
  mo: { type: Boolean, required: true },
  banGhi: { type: Object, default: null },
})

const emit = defineEmits(['dong'])

const congNo = useCongNoStore()
const toast = useToast()

const ID = { ten: 'mh-ten', donGia: 'mh-don-gia' }
const form = reactive({ ten: '', dvt: '', don_gia: '' })
const loi = reactive({ ten: '', don_gia: '' })
const loiMayChu = ref('')
const dangLuu = ref(false)
const daChinhSua = ref(false)

const dangSua = computed(() => Boolean(props.banGhi?.id))

const QUY_TAC = [
  {
    khoa: 'ten',
    id: ID.ten,
    kiemTra: () => {
      const ten = form.ten.trim()
      if (!ten) return 'Vui lòng nhập tên mặt hàng.'
      const trung = congNo.matHang.some(
        (m) => khoaTen(m.ten) === khoaTen(ten) && m.id !== props.banGhi?.id,
      )
      return trung ? 'Đã có mặt hàng trùng tên này trong danh mục.' : ''
    },
  },
  {
    khoa: 'don_gia',
    id: ID.donGia,
    kiemTra: () => {
      const n = phanTichSo(form.don_gia)
      if (!Number.isFinite(n)) return 'Đơn giá phải là số. Ví dụ: 25000.'
      return n >= 0 ? '' : 'Đơn giá không được âm.'
    },
  },
]

watch(
  () => props.mo,
  (mo) => {
    if (!mo) return
    Object.assign(form, {
      ten: props.banGhi?.ten ?? '',
      dvt: props.banGhi?.dvt ?? '',
      don_gia: props.banGhi ? String(props.banGhi.don_gia ?? '') : '',
    })
    loi.ten = ''
    loi.don_gia = ''
    loiMayChu.value = ''
    daChinhSua.value = false
  },
)

watch(
  () => ({ ...form }),
  () => {
    daChinhSua.value = true
    // Ô đang báo lỗi thì kiểm tra lại ngay khi gõ, để thông báo biến mất
    // đúng lúc người dùng vừa sửa xong.
    for (const q of QUY_TAC) {
      if (loi[q.khoa]) loi[q.khoa] = q.kiemTra()
    }
  },
  { deep: true },
)

const danhSachLoi = computed(() => {
  const ds = QUY_TAC.filter((q) => loi[q.khoa]).map((q) => ({ id: q.id, chu: loi[q.khoa] }))
  if (loiMayChu.value) ds.push({ id: ID.ten, chu: loiMayChu.value })
  return ds
})

function roiO(khoa) {
  const q = QUY_TAC.find((x) => x.khoa === khoa)
  if (q && form[khoa]) loi[khoa] = q.kiemTra()
}

async function luu() {
  loiMayChu.value = ''
  for (const q of QUY_TAC) loi[q.khoa] = q.kiemTra()
  if (danhSachLoi.value.length) return

  dangLuu.value = true
  try {
    await congNo.luuMatHang({
      id: props.banGhi?.id,
      ten: form.ten,
      dvt: form.dvt,
      don_gia: phanTichSo(form.don_gia),
    })
    toast.thanhCong(dangSua.value ? 'Đã cập nhật mặt hàng.' : 'Đã thêm mặt hàng mới.')
    emit('dong')
  } catch (e) {
    loiMayChu.value = e.message
  } finally {
    dangLuu.value = false
  }
}
</script>

<template>
  <BaseModal
    :mo="mo"
    :tieu-de="dangSua ? 'Sửa mặt hàng' : 'Thêm mặt hàng'"
    :can-xac-nhan-dong="daChinhSua && !dangLuu"
    @dong="emit('dong')"
  >
    <form id="form-mat-hang" novalidate @submit.prevent="luu">
      <ErrorSummary :loi="danhSachLoi" />

      <div class="luoi">
        <BaseField
          v-slot="{ id, moTaBoi, coLoi }"
          nhan="Tên mặt hàng"
          :id-truong="ID.ten"
          bat-buoc
          :loi="loi.ten"
        >
          <input
            :id="id"
            v-model="form.ten"
            type="text"
            :aria-invalid="coLoi || undefined"
            :aria-describedby="moTaBoi"
            @blur="roiO('ten')"
          />
        </BaseField>

        <BaseField v-slot="{ id, moTaBoi }" nhan="Đơn vị tính" goi-y="Ví dụ: kg, chai, lít, thùng.">
          <input :id="id" v-model="form.dvt" type="text" :aria-describedby="moTaBoi" />
        </BaseField>

        <BaseField
          v-slot="{ id, moTaBoi, coLoi }"
          nhan="Đơn giá"
          :id-truong="ID.donGia"
          bat-buoc
          goi-y="Sẽ được tự điền khi bạn chọn mặt hàng này lúc ghi giao dịch."
          :loi="loi.don_gia"
        >
          <input
            :id="id"
            v-model="form.don_gia"
            type="text"
            inputmode="numeric"
            :aria-invalid="coLoi || undefined"
            :aria-describedby="moTaBoi"
            @blur="roiO('don_gia')"
          />
        </BaseField>
      </div>
    </form>

    <template #chan>
      <BaseButton kieu="phu" @click="emit('dong')">Huỷ</BaseButton>
      <BaseButton type="submit" form="form-mat-hang" kieu="chinh" :dang-tai="dangLuu">
        {{ dangSua ? 'Lưu thay đổi' : 'Thêm mặt hàng' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.luoi {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
