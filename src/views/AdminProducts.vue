<template>
  <div class="admin-products">
    <AdminNav />
    <div v-if="loading">載入中...</div>
    <div v-else>
      <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
      <button @click="showCreate = true">新增商品</button>
      <table v-if="products.length">
        <thead>
          <tr>
            <th>ID</th>
            <th>名稱</th>
            <th>價格</th>
            <th>庫存</th>
            <th>圖片</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id">
            <td>{{ p.id }}</td>
            <td>{{ p.name }}</td>
            <td>{{ p.price }}</td>
            <td>{{ p.stock }}</td>
            <td>
              <img v-if="p.imageUrl" :src="p.imageUrl" alt="商品圖片" style="max-width:60px;max-height:60px;object-fit:cover;" />
            </td>
            <td>
              <button @click="startEdit(p)">編輯</button>
              <button @click="deleteProduct(p.id)">刪除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else>目前沒有商品</div>
      <!-- 新增商品表單 -->
      <div v-if="showCreate" class="modal">
        <div class="modal-content">
          <h3>新增商品</h3>
          <label>名稱：<input v-model="newName" required /></label><br />
          <label>價格：<input v-model.number="newPrice" type="number" min="0" required /></label><br />
          <label>庫存：<input v-model.number="newStock" type="number" min="0" required /></label><br />
          <label>圖片網址：<input v-model="newImageUrl" placeholder="可不填" /></label>
          <input type="file" accept="image/*" @change="e => handleUpload(e, 'new')" style="margin-top:8px;" />
          <div v-if="uploadingNew" style="color:#888;">圖片上傳中...</div>
          <div v-if="newImageUrl" style="margin:8px 0;">
            <img :src="newImageUrl" alt="預覽" style="max-width:120px;max-height:120px;object-fit:cover;" />
          </div>
          <button @click="createProduct">新增</button>
          <button @click="showCreate = false">取消</button>
        </div>
      </div>
      <!-- 編輯商品表單 -->
      <div v-if="editId !== null" class="modal">
        <div class="modal-content">
          <h3>編輯商品</h3>
          <label>名稱：<input v-model="editName" required /></label><br />
          <label>價格：<input v-model.number="editPrice" type="number" min="0" required /></label><br />
          <label>庫存：<input v-model.number="editStock" type="number" min="0" required /></label><br />
          <label>圖片網址：<input v-model="editImageUrl" placeholder="可不填" /></label>
          <input type="file" accept="image/*" @change="e => handleUpload(e, 'edit')" style="margin-top:8px;" />
          <div v-if="uploadingEdit" style="color:#888;">圖片上傳中...</div>
          <div v-if="editImageUrl" style="margin:8px 0;">
            <img :src="editImageUrl" alt="預覽" style="max-width:120px;max-height:120px;object-fit:cover;" />
          </div>
          <button @click="saveEdit(editId)">儲存</button>
          <button @click="cancelEdit">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { basic_url } from '@/config';
import AdminNav from '@/components/AdminNav.vue';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

const router = useRouter();
const products = ref<Product[]>([]);
const loading = ref(true);
const errorMsg = ref('');
const showCreate = ref(false);
const newName = ref('');
const newPrice = ref(0);
const newStock = ref(0);
const newImageUrl = ref('');
const editId = ref<number|null>(null);
const editName = ref('');
const editPrice = ref(0);
const editStock = ref(0);
const editImageUrl = ref('');
const uploadingNew = ref(false);
const uploadingEdit = ref(false);

const fetchProducts = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    const res = await axios.get(`${basic_url}/admin/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    products.value = res.data.sort((a: Product, b: Product) => a.id - b.id);
  } catch (e: any) {
    if (e.response && (e.response.status === 401 || e.response.status === 403)) {
      router.push('/admin/login');
    } else {
      errorMsg.value = e.response?.data || '載入失敗';
    }
  } finally {
    loading.value = false;
  }
};

const startEdit = (p: Product) => {
  editId.value = p.id;
  editName.value = p.name;
  editPrice.value = p.price;
  editStock.value = p.stock;
  editImageUrl.value = p.imageUrl || '';
};
const cancelEdit = () => {
  editId.value = null;
  editName.value = '';
  editPrice.value = 0;
  editStock.value = 0;
  editImageUrl.value = '';
};
const saveEdit = async (id: number) => {
  if (!editName.value || editPrice.value === null || editStock.value === null) {
    alert('請填寫所有欄位');
    return;
  }
  try {
    const token = localStorage.getItem('admin_token');
    await axios.put(`${basic_url}/admin/products/${id}`, {
      name: editName.value,
      price: editPrice.value,
      stock: editStock.value,
      imageUrl: editImageUrl.value || ''
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    cancelEdit();
    await fetchProducts();
  } catch (e: any) {
    if (e.response && (e.response.status === 401 || e.response.status === 403)) {
      alert('權限不足，請重新登入管理員帳號');
      router.push('/admin/login');
    } else {
      alert('更新失敗');
    }
  }
};
const deleteProduct = async (id: number) => {
  if (!confirm('確定要刪除此商品嗎？')) return;
  try {
    const token = localStorage.getItem('admin_token');
    await axios.delete(`${basic_url}/admin/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchProducts();
  } catch (e: any) {
    if (e.response && (e.response.status === 401 || e.response.status === 403)) {
      alert('權限不足，請重新登入管理員帳號');
      router.push('/admin/login');
    } else {
      alert('刪除失敗');
    }
  }
};
const createProduct = async () => {
  if (!newName.value || newPrice.value < 0 || newStock.value === null) {
    alert('請輸入正確的名稱、價格與庫存');
    return;
  }
  try {
    const token = localStorage.getItem('admin_token');
    await axios.post(`${basic_url}/admin/products`, {
      name: newName.value,
      price: newPrice.value,
      stock: newStock.value,
      imageUrl: newImageUrl.value || ''
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    showCreate.value = false;
    newName.value = '';
    newPrice.value = 0;
    newStock.value = 0;
    newImageUrl.value = '';
    fetchProducts();
  } catch (e: any) {
    if (e.response && (e.response.status === 401 || e.response.status === 403)) {
      alert('權限不足，請重新登入管理員帳號');
      router.push('/admin/login');
    } else {
      alert('新增失敗');
    }
  }
};

const handleUpload = async (event: Event, type: 'new' | 'edit') => {
  const input = event.target as HTMLInputElement;
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const fileName = `${Date.now()}_${file.name}`;
  const fileType = file.type;
  if (type === 'new') uploadingNew.value = true;
  else uploadingEdit.value = true;
  try {
    const token = localStorage.getItem('admin_token');
    // 1. 取得 presigned url，這裡要帶上 Authorization header
    const res = await axios.post(`${basic_url}/api/upload/get-presigned-url`, {
      fileName,
      fileType
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { uploadUrl, fileUrl } = res.data;
    // 2. PUT 圖片到 uploadUrl
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': fileType },
      body: file
    });
    // 3. 設定 imageUrl
    if (type === 'new') newImageUrl.value = fileUrl;
    else editImageUrl.value = fileUrl;
  } catch (e) {
    alert('圖片上傳失敗');
  } finally {
    if (type === 'new') uploadingNew.value = false;
    else uploadingEdit.value = false;
  }
};

onMounted(fetchProducts);
</script>

<style scoped>
.admin-products {
  max-width: 900px;
  margin: 40px auto;
  padding: 32px;
  border: 1px solid #b2dfdb;
  border-radius: 12px;
  background: #e8f5e9;
  box-shadow: 0 2px 12px rgba(76,175,80,0.08);
}
h2 {
  color: #388e3c;
  text-align: center;
  margin-bottom: 28px;
  letter-spacing: 2px;
}
button {
  background: linear-gradient(90deg, #43a047 0%, #66bb6a 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 18px;
  font-size: 15px;
  margin: 0 2px;
  cursor: pointer;
  transition: background 0.2s;
}
button:hover {
  background: #388e3c;
}
button:disabled {
  background: #bdbdbd;
  color: #eee;
  cursor: not-allowed;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(76,175,80,0.07);
  table-layout: fixed;
}
th {
  background: #a5d6a7;
  color: #1b5e20;
  padding: 10px 0;
  font-weight: 600;
  letter-spacing: 1px;
}
th, td {
  border: 1px solid #c8e6c9;
  padding: 10px 8px;
  text-align: center;
  vertical-align: middle;
  height: 44px;
  overflow: hidden;
}
th:nth-child(1), td:nth-child(1) { width: 6%; }
th:nth-child(2), td:nth-child(2) { width: 18%; }
th:nth-child(3), td:nth-child(3) { width: 13%; }
th:nth-child(4), td:nth-child(4) { width: 13%; }
th:nth-child(5), td:nth-child(5) { width: 18%; }
th:nth-child(6), td:nth-child(6) { width: 32%; }
input[type="text"], input[type="number"] {
  border: 1px solid #b2dfdb;
  border-radius: 4px;
  padding: 5px 8px;
  font-size: 15px;
  background: #f9fff9;
  outline: none;
  transition: border 0.2s;
  width: 100%;
  min-height: 32px;
  box-sizing: border-box;
  margin: 0;
  vertical-align: middle;
}
input[type="text"]:focus, input[type="number"]:focus {
  border: 1.5px solid #43a047;
}
.error {
  color: #d32f2f;
  margin-bottom: 12px;
  text-align: center;
  font-weight: 500;
}
.modal {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(56,142,60,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #f1f8e9;
  padding: 32px 28px;
  border-radius: 10px;
  min-width: 320px;
  box-shadow: 0 2px 16px rgba(76,175,80,0.13);
  border: 1.5px solid #a5d6a7;
}
.modal-content h3 {
  color: #388e3c;
  margin-bottom: 18px;
  text-align: center;
}
.modal-content label {
  color: #388e3c;
  font-weight: 500;
  margin-bottom: 6px;
  display: inline-block;
}
.modal-content input[type="text"],
.modal-content input[type="number"] {
  margin-bottom: 10px;
  width: 90%;
}
img {
  border-radius: 6px;
  border: 1px solid #b2dfdb;
  background: #fff;
}
</style>
