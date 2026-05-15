<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useDispatchStore } from '../stores/useDispatchStore'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  select: [name: string, target: 'origin' | 'dest']
}>()

const store = useDispatchStore()

const newAddressName = ref('')
const adding = ref(false)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      store.fetchAddresses()
      newAddressName.value = ''
    }
  }
)

async function handleAdd() {
  const name = newAddressName.value.trim()
  if (!name) return

  adding.value = true
  try {
    await store.createAddress(name)
    newAddressName.value = ''
    ElMessage.success('地址添加成功')
  } catch {
    // error handled by store
  } finally {
    adding.value = false
  }
}

async function handleDelete(id: string) {
  try {
    await store.deleteAddress(id)
    ElMessage.success('地址删除成功')
  } catch {
    // error handled by store
  }
}

function handleSelect(name: string, target: 'origin' | 'dest') {
  emit('select', name, target)
  emit('update:visible', false)
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="常用地址"
    width="500px"
    @update:model-value="handleClose"
  >
    <div class="address-dialog__add">
      <el-input
        v-model="newAddressName"
        placeholder="输入地址名称"
        style="flex: 1"
        @keyup.enter="handleAdd"
      />
      <el-button
        type="primary"
        :loading="adding"
        @click="handleAdd"
      >
        保存
      </el-button>
    </div>

    <div
      v-if="store.addresses.length === 0"
      class="address-dialog__empty"
    >
      暂无常用地址
    </div>

    <div
      v-else
      class="address-dialog__list"
    >
      <div
        v-for="addr in store.addresses"
        :key="addr.id"
        class="address-dialog__item"
      >
        <span class="address-dialog__name">{{ addr.name }}</span>
        <div class="address-dialog__actions">
          <el-button
            size="small"
            link
            type="primary"
            @click="handleSelect(addr.name, 'origin')"
          >
            设为起运地
          </el-button>
          <el-button
            size="small"
            link
            type="success"
            @click="handleSelect(addr.name, 'dest')"
          >
            设为目的地
          </el-button>
          <el-button
            size="small"
            link
            type="danger"
            @click="handleDelete(addr.id)"
          >
            删除
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.address-dialog__add {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.address-dialog__empty {
  padding: 40px 0;
  text-align: center;
  color: #909399;
}

.address-dialog__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.address-dialog__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.address-dialog__name {
  font-size: 14px;
  color: #303133;
}

.address-dialog__actions {
  display: flex;
  gap: 4px;
}
</style>