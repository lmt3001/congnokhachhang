<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useCongNoStore } from '@/stores/congNoStore'
import { useToast } from '@/composables/useToast'
import { khoaTen } from '@/utils/format'
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

const ID_TEN = 'kh-ten'
const form = reactive({ ten: '', sdt: '', dia_chi: '', ghi_chu: '' })
const loiTen = ref('')
const loiMayChu = ref('')
const dangLuu = ref(false)
const daChinhSua = ref(false)

const dangSua = computed(() => Boolean(props.banGhi?.id))

function kiemTraTen() {
  const ten = form.ten.trim()
  if (!ten) return 'Vui lòng nhập tên khách hàng.'
  // Trùng tên sẽ làm bảng tổng hợp gộp nhầm hai người thành một.
  const trung = congNo.khachHang.some(
    (k) => khoaTen(k.ten) === khoaTen(ten) && k.id !== props.banGhi?.id,
  )
  return trung ? 'Đã có khách hàng trùng tên này. Hãy thêm chi tiết để phân biệt.' : ''
}

watch(
  () => props.mo,
  (mo) => {
    if (!mo) return
    Object.assign(form, {
      ten: props.banGhi?.ten ?? '',
      sdt: props.banGhi?.sdt ?? '',
      dia_chi: props.banGhi?.dia_chi ?? '',
      ghi_chu: props.banGhi?.ghi_chu ?? '',
    })
    loiTen.value = ''
    loiMayChu.value = ''
    daChinhSua.value = false
  },
)

watch(
  () => ({ ...form }),
  () => {
    daChinhSua.value = true
    // Đang báo lỗi thì kiểm tra lại ngay khi gõ, để thông báo biến mất đúng
    // lúc người dùng vừa sửa xong.
    if (loiTen.value) loiTen.value = kiemTraTen()
  },
  { deep: true },
)

const danhSachLoi = computed(() => {
  const ds = []
  if (loiTen.value) ds.push({ id: ID_TEN, chu: loiTen.value })
  if (loiMayChu.value) ds.push({ id: ID_TEN, chu: loiMayChu.value })
  return ds
})

async function luu() {
  loiMayChu.value = ''
  loiTen.value = kiemTraTen()
  if (danhSachLoi.value.length) return

  dangLuu.value = true
  try {
    await congNo.luuKhachHang({ ...form, id: props.banGhi?.id })
    toast.thanhCong(dangSua.value ? 'Đã cập nhật khách hàng.' : 'Đã thêm khách hàng mới.')
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
    :tieu-de="dangSua ? 'Sửa khách hàng' : 'Thêm khách hàng'"
    :can-xac-nhan-dong="daChinhSua && !dangLuu"
    @dong="emit('dong')"
  >
    <form id="form-khach-hang" novalidate @submit.prevent="luu">
      <ErrorSummary :loi="danhSachLoi" />

      <div class="luoi">
        <BaseField
          v-slot="{ id, moTaBoi, coLoi }"
          nhan="Tên khách hàng"
          :id-truong="ID_TEN"
          bat-buoc
          :loi="loiTen"
        >
          <input
            :id="id"
            v-model="form.ten"
            type="text"
            autocomplete="name"
            :aria-invalid="coLoi || undefined"
            :aria-describedby="moTaBoi"
            @blur="loiTen = form.ten ? kiemTraTen() : ''"
          />
        </BaseField>

        <BaseField
          v-slot="{ id, moTaBoi }"
          nhan="Số điện thoại"
          goi-y="Sẽ được tự điền khi bạn chọn khách này lúc ghi giao dịch."
        >
          <input
            :id="id"
            v-model="form.sdt"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            :aria-describedby="moTaBoi"
          />
        </BaseField>

        <BaseField v-slot="{ id, moTaBoi }" nhan="Địa chỉ">
          <input
            :id="id"
            v-model="form.dia_chi"
            type="text"
            autocomplete="street-address"
            :aria-describedby="moTaBoi"
          />
        </BaseField>

        <BaseField v-slot="{ id, moTaBoi }" nhan="Ghi chú">
          <textarea :id="id" v-model="form.ghi_chu" rows="2" :aria-describedby="moTaBoi" />
        </BaseField>
      </div>
    </form>

    <template #chan>
      <BaseButton kieu="phu" @click="emit('dong')">Huỷ</BaseButton>
      <BaseButton type="submit" form="form-khach-hang" kieu="chinh" :dang-tai="dangLuu">
        {{ dangSua ? 'Lưu thay đổi' : 'Thêm khách hàng' }}
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
