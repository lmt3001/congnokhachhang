<script setup>
import { PhCompass } from '@phosphor-icons/vue'
import EmptyState from '@/components/base/EmptyState.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div>
    <h1 class="sr-only">Không tìm thấy trang</h1>
    <EmptyState
      :icon="PhCompass"
      tieu-de="Không tìm thấy trang"
      mo-ta="Địa chỉ bạn vừa mở không tồn tại hoặc đã bị đổi."
    >
      <BaseButton kieu="chinh" @click="router.push({ name: 'nhat-ky' })">
        Về sổ nhật ký
      </BaseButton>
    </EmptyState>
  </div>
</template>
