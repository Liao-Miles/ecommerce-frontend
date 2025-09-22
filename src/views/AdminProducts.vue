<template>
  <div class="admin-products">
    <AdminNav />
    <div v-if="loading">載入中...</div>
    <div v-else>
      <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
      <!-- 搜尋區塊 -->
      <div style="margin-bottom:18px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <input v-model="searchId" type="number" min="1" placeholder="商品ID" style="width:110px;" />
        <input v-model="searchName" type="text" placeholder="商品名稱" style="width:160px;" />
        <select v-model.number="searchCategoryId" style="width:140px;">
          <option value="">全部分類</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <button @click="searchProducts" :disabled="searching">搜尋</button>
        <button @click="resetSearch" :disabled="searching">重置</button>
        <span v-if="searching" style="color:#888;margin-left:8px;">搜尋中...</span>
      </div>
      <button @click="showCreate = true">新增商品</button>
      <button @click="showCreateCategory = true" style="margin-left:8px;">新增分類</button>
      <table v-if="products.length">
        <thead>
          <tr>
            <th @click="sortBy('id')" style="cursor:pointer;">ID <span v-if="sortKey==='id'">{{ sortOrder==='asc'?'▲':'▼' }}</span></th>
            <th @click="sortBy('name')" style="cursor:pointer;">名稱 <span v-if="sortKey==='name'">{{ sortOrder==='asc'?'▲':'▼' }}</span></th>
            <th @click="sortBy('price')" style="cursor:pointer;">價格 <span v-if="sortKey==='price'">{{ sortOrder==='asc'?'▲':'▼' }}</span></th>
            <th @click="sortBy('stock')" style="cursor:pointer;">庫存 <span v-if="sortKey==='stock'">{{ sortOrder==='asc'?'▲':'▼' }}</span></th>
            <th @click="sortBy('categories')" style="cursor:pointer;">分類 <span v-if="sortKey==='categories'">{{ sortOrder==='asc'?'▲':'▼' }}</span></th>
            <th>圖片</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in sortedProducts" :key="p.id">
            <td>{{ p.id }}</td>
            <td>{{ p.name }}</td>
            <td>{{ p.price }}</td>
            <td>{{ p.stock }}</td>
            <td>{{ p.categories?.map(c => c.name).join(', ') || '無分類' }}</td>
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
          <label>分類：
            <select multiple v-model="newCategoryIds" style="width:100%;height:120px;margin-top:4px;padding:4px;">
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <small style="color:#666;display:block;margin-top:4px;">按住 Ctrl 或 Cmd 可多選，至少選擇一個分類</small>
          </label><br />
          <label>圖片網址：<input v-model="newImageUrl" placeholder="可不填" /></label>
          <input type="file" accept="image/*" @change="e => handleUpload(e, 'new')" style="margin-top:8px;" />
          <div v-if="uploadingNew" style="color:#888;">圖片上傳中...</div>
          <div v-if="newImageUrl" style="margin:8px 0;">
            <img :src="newImageUrl" alt="預覽" style="max-width:120px;max-height:120px;object-fit:cover;" />
          </div>
          <button @click="createProduct">新增</button>
          <button @click="cancelCreate">取消</button>
        </div>
      </div>

      <!-- 編輯商品表單 -->
      <div v-if="editId !== null" class="modal">
        <div class="modal-content">
          <h3>編輯商品</h3>
          <label>名稱：<input v-model="editName" required /></label><br />
          <label>價格：<input v-model.number="editPrice" type="number" min="0" required /></label><br />
          <label>庫存：<input v-model.number="editStock" type="number" min="0" required /></label><br />
          <label>分類：
            <select multiple v-model="editCategoryIds" style="width:100%;height:120px;margin-top:4px;padding:4px;">
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <small style="color:#666;display:block;margin-top:4px;">按住 Ctrl 或 Cmd 可多選，至少選擇一個分類</small>
          </label><br />
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

      <!-- 新增分類表單 -->
      <div v-if="showCreateCategory" class="modal">
        <div class="modal-content category-modal-content">
          <h3>新增分類</h3>
          <form @submit.prevent="createCategory">
            <div class="category-form-row">
              <label>名稱</label>
              <input v-model="newCategoryName" required placeholder="請輸入分類名稱" />
            </div>
            <div class="category-form-row">
              <label>描述</label>
              <input v-model="newCategoryDesc" placeholder="可不填" />
            </div>
            <div v-if="categoryErrorMsg" class="error">{{ categoryErrorMsg }}</div>
            <div class="category-form-actions">
              <button type="submit" :disabled="categoryLoading">
                <span v-if="categoryLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                新增
              </button>
              <button type="button" @click="cancelCreateCategory">取消</button>
            </div>
          </form>
          <hr style="margin:22px 0 16px 0;" />
          <h4 style="margin-bottom:12px;">分類列表</h4>
          <div class="category-table-wrapper">
            <table v-if="categories.length" class="category-table">
              <thead>
                <tr>
                  <th style="width:48px;min-width:36px;">ID</th>
                  <th style="width:110px;min-width:80px;">名稱</th>
                  <th style="width:180px;min-width:120px;">描述</th>
                  <th style="width:80px;min-width:60px;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cat in categories" :key="cat.id">
                  <td>{{ cat.id }}</td>
                  <td class="cat-name">{{ cat.name }}</td>
                  <td class="cat-desc">{{ cat.description || '-' }}</td>
                  <td>
                    <div class="cat-action-btns">
                      <button class="cat-btn" @click="startEditCategory(cat)">編輯</button>
                      <button class="cat-btn delete" @click="deleteCategory(cat.id)">刪除</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else style="color:#888;">目前沒有分類</div>
          </div>
        </div>
      </div>

      <!-- 編輯分類表單 -->
      <div v-if="editCategoryId !== null" class="modal">
        <div class="modal-content">
          <h3>編輯分類</h3>
          <div style="margin-bottom:16px;">
            <label style="display:block;margin-bottom:8px;">名稱：<input v-model="editCategoryName" required style="margin-top:4px;" /></label>
            <label style="display:block;margin-bottom:8px;">描述：<input v-model="editCategoryDesc" placeholder="可不填" style="margin-top:4px;" /></label>
            <div v-if="editCategoryErrorMsg" class="error">{{ editCategoryErrorMsg }}</div>
            <div style="margin-top:12px;">
              <button @click="saveEditCategory(editCategoryId)" :disabled="editCategoryLoading">
                <span v-if="editCategoryLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                儲存
              </button>
              <button @click="cancelEditCategory" style="margin-left:8px;">取消</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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
  categories: { id: number; name: string }[];
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

const router = useRouter();
const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(true);
const errorMsg = ref('');
const showCreate = ref(false);
const newName = ref('');
const newPrice = ref(0);
const newStock = ref(0);
const newImageUrl = ref('');
const newCategoryIds = ref<number[]>([]);
const editId = ref<number|null>(null);
const editName = ref('');
const editPrice = ref(0);
const editStock = ref(0);
const editImageUrl = ref('');
const editCategoryIds = ref<number[]>([]);
const uploadingNew = ref(false);
const uploadingEdit = ref(false);

// 新增分類相關狀態
const showCreateCategory = ref(false);
const newCategoryName = ref('');
const newCategoryDesc = ref('');
const categoryErrorMsg = ref('');
const categoryLoading = ref(false);

// 編輯分類相關狀態
const editCategoryId = ref<number|null>(null);
const editCategoryName = ref('');
const editCategoryDesc = ref('');
const editCategoryErrorMsg = ref('');
const editCategoryLoading = ref(false);

// 搜尋相關狀態
const searchId = ref<number | null>(null);
const searchName = ref('');
const searchCategoryId = ref<number | null>(null);
const searching = ref(false);

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

const fetchCategories = async () => {
  try {
    const token = localStorage.getItem('admin_token');
    const res = await axios.get(`${basic_url}/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    categories.value = res.data;
    console.log('載入的分類數量:', categories.value.length);
    console.log('分類詳細:', categories.value);
  } catch (e) {
    console.error('載入分類失敗', e);
  }
};

const startEdit = (p: Product) => {
  editId.value = p.id;
  editName.value = p.name;
  editPrice.value = p.price;
  editStock.value = p.stock;
  editImageUrl.value = p.imageUrl || '';
  editCategoryIds.value = p.categories?.map(c => c.id) || [];
};

const cancelEdit = () => {
  editId.value = null;
  editName.value = '';
  editPrice.value = 0;
  editStock.value = 0;
  editImageUrl.value = '';
  editCategoryIds.value = [];
};

const cancelCreate = () => {
  showCreate.value = false;
  newName.value = '';
  newPrice.value = 0;
  newStock.value = 0;
  newImageUrl.value = '';
  newCategoryIds.value = [];
};

const saveEdit = async (id: number) => {
  if (!editName.value || editPrice.value === null || editStock.value === null) {
    alert('請填寫所有欄位');
    return;
  }

  if (editCategoryIds.value.length === 0) {
    alert('請至少選擇一個分類');
    return;
  }

  try {
    const token = localStorage.getItem('admin_token');
    await axios.put(`${basic_url}/admin/products/${id}`, {
      name: editName.value,
      price: editPrice.value,
      stock: editStock.value,
      imageUrl: editImageUrl.value || '',
      categoryIds: editCategoryIds.value
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

  if (newCategoryIds.value.length === 0) {
    alert('請至少選擇一個分類');
    return;
  }

  try {
    const token = localStorage.getItem('admin_token');
    await axios.post(`${basic_url}/admin/products`, {
      name: newName.value,
      price: newPrice.value,
      stock: newStock.value,
      imageUrl: newImageUrl.value || '',
      categoryIds: newCategoryIds.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    cancelCreate();
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

// 新增分類
const createCategory = async () => {
  if (!newCategoryName.value.trim()) {
    categoryErrorMsg.value = '請輸入分類名稱';
    return;
  }
  categoryLoading.value = true;
  categoryErrorMsg.value = '';
  try {
    const token = localStorage.getItem('admin_token');
    const res = await axios.post(`${basic_url}/admin/categories`, {
      name: newCategoryName.value.trim(),
      description: newCategoryDesc.value.trim() || undefined
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    showCreateCategory.value = false;
    newCategoryName.value = '';
    newCategoryDesc.value = '';
    await fetchCategories();
  } catch (e: any) {
    if (e && typeof e === 'object' && 'response' in e && e.response && 'data' in e.response) {
      categoryErrorMsg.value = (e.response as any).data;
    } else {
      categoryErrorMsg.value = '新增分類失敗';
    }
  } finally {
    categoryLoading.value = false;
  }
};

const cancelCreateCategory = () => {
  showCreateCategory.value = false;
  newCategoryName.value = '';
  newCategoryDesc.value = '';
  categoryErrorMsg.value = '';
};

const startEditCategory = (cat: Category) => {
  editCategoryId.value = cat.id;
  editCategoryName.value = cat.name;
  editCategoryDesc.value = cat.description || '';
  editCategoryErrorMsg.value = '';
};

const cancelEditCategory = () => {
  editCategoryId.value = null;
  editCategoryName.value = '';
  editCategoryDesc.value = '';
  editCategoryErrorMsg.value = '';
};

const saveEditCategory = async (id: number) => {
  if (!editCategoryName.value.trim()) {
    editCategoryErrorMsg.value = '請輸入分類名稱';
    return;
  }
  editCategoryLoading.value = true;
  editCategoryErrorMsg.value = '';
  try {
    const token = localStorage.getItem('admin_token');
    await axios.put(`${basic_url}/admin/categories/${id}`, {
      name: editCategoryName.value.trim(),
      description: editCategoryDesc.value.trim() || undefined
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    editCategoryId.value = null;
    await fetchCategories();
  } catch (e: any) {
    if (e && typeof e === 'object' && 'response' in e && e.response && 'data' in e.response) {
      editCategoryErrorMsg.value = (e.response as any).data;
    } else {
      editCategoryErrorMsg.value = '更新分類失敗';
    }
  } finally {
    editCategoryLoading.value = false;
  }
};

const deleteCategory = async (id: number) => {
  if (!confirm('確定要刪除此分類嗎？')) return;
  try {
    const token = localStorage.getItem('admin_token');
    await axios.delete(`${basic_url}/admin/categories/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await fetchCategories();
    await fetchProducts(); // 重新載入商品，避免分類異動
  } catch (e: any) {
    let msg = '刪除失敗';
    if (e && typeof e === 'object' && 'response' in e && e.response && 'data' in e.response) {
      msg = (e.response as any).data;
    }
    alert(msg);
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
    const res = await axios.post(`${basic_url}/api/upload/get-presigned-url`, {
      fileName,
      fileType
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const { uploadUrl, fileUrl } = res.data;

    await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': fileType },
      body: file
    });

    if (type === 'new') newImageUrl.value = fileUrl;
    else editImageUrl.value = fileUrl;
  } catch (e: any) {
    alert('圖片上傳失敗');
  } finally {
    if (type === 'new') uploadingNew.value = false;
    else uploadingEdit.value = false;
  }
};

const sortKey = ref('id');
const sortOrder = ref('asc');

const sortBy = (key: 'id' | 'name' | 'price' | 'stock' | 'categories') => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const sortedProducts = computed(() => {
  const modifier = sortOrder.value === 'asc' ? 1 : -1;
  return [...products.value].sort((a, b) => {
    switch (sortKey.value) {
      case 'id':
        return (a.id - b.id) * modifier;
      case 'name':
        return a.name.localeCompare(b.name) * modifier;
      case 'price':
        return (a.price - b.price) * modifier;
      case 'stock':
        return (a.stock - b.stock) * modifier;
      case 'categories':
        return (a.categories?.[0]?.name || '').localeCompare(b.categories?.[0]?.name || '') * modifier;
      default:
        return 0;
    }
  });
});

const searchProducts = async () => {
  if (searching.value) return;
  searching.value = true;
  try {
    const token = localStorage.getItem('admin_token');
    // 構建查詢參數，只帶入有值的欄位，並確保型別正確
    const params: any = {};
    if (searchId.value !== null && searchId.value !== undefined && searchId.value !== '') params.id = Number(searchId.value);
    if (searchName.value) params.name = searchName.value;
    if (searchCategoryId.value !== null && searchCategoryId.value !== undefined && searchCategoryId.value !== '') params.categoryId = Number(searchCategoryId.value);
    const res = await axios.get(`${basic_url}/admin/products/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    products.value = res.data;
  } catch (e: any) {
    alert('搜尋失敗');
  } finally {
    searching.value = false;
  }
};

const resetSearch = () => {
  searchId.value = null;
  searchName.value = '';
  searchCategoryId.value = null;
  fetchProducts();
};

onMounted(() => {
  fetchProducts();
  fetchCategories();
});
</script>

<style scoped>
.admin-products {
  max-width: 1100px;
  margin: 40px auto;
  padding: 32px;
  border: 1px solid #b2dfdb;
  border-radius: 12px;
  background: #e8f5e9;
  box-shadow: 0 2px 12px rgba(76,175,80,0.08);
  margin-left: 200px; /* 避開 sidebar */
}

@media (max-width: 700px) {
  .admin-products {
    margin-left: 0 !important;
    padding: 12px;
  }
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
th:nth-child(2), td:nth-child(2) { width: 15%; }
th:nth-child(3), td:nth-child(3) { width: 10%; }
th:nth-child(4), td:nth-child(4) { width: 10%; }
th:nth-child(5), td:nth-child(5) { width: 20%; }
th:nth-child(6), td:nth-child(6) { width: 15%; }
th:nth-child(7), td:nth-child(7) { width: 24%; }

input[type="text"], input[type="number"], select {
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

input[type="text"]:focus, input[type="number"]:focus, select:focus {
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
  min-width: 380px;
  max-width: 540px;
  box-shadow: 0 2px 16px rgba(76,175,80,0.13);
  border: 1.5px solid #a5d6a7;
  max-height: 80vh;
  overflow-y: auto;
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
  width: 100%;
}

.modal-content input[type="text"],
.modal-content input[type="number"],
.modal-content select {
  margin-bottom: 10px;
  width: 100%;
  box-sizing: border-box;
}

img {
  border-radius: 6px;
  border: 1px solid #b2dfdb;
  background: #fff;
}

.category-modal-content {
  max-width: 700px;
  min-width: 420px;
  padding: 36px 32px 28px 32px;
}

.category-form-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.category-form-row label {
  min-width: 56px;
  font-weight: 600;
  color: #388e3c;
  font-size: 16px;
}

.category-form-row input {
  flex: 1;
  padding: 7px 10px;
  font-size: 15px;
  border-radius: 5px;
  border: 1.2px solid #b2dfdb;
  background: #f9fff9;
  transition: border 0.2s;
}

.category-form-row input:focus {
  border: 1.5px solid #43a047;
}

.category-form-actions {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  margin-bottom: 2px;
}

.category-table-wrapper {
  max-height: 260px;
  overflow-y: auto;
  overflow-x: auto;
  border: 1px solid #c8e6c9;
  border-radius: 7px;
  background: #fff;
  box-shadow: 0 1px 6px rgba(76,175,80,0.07);
}

.category-table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  font-size: 15px;
}

.category-table th, .category-table td {
  padding: 10px 8px;
  border: 1px solid #c8e6c9;
  text-align: center;
  vertical-align: middle;
}

.category-table th {
  background: #a5d6a7;
  color: #1b5e20;
  font-weight: 600;
}

.cat-name {
  max-width: 110px;
  word-break: break-all;
}

.cat-desc {
  max-width: 180px;
  word-break: break-all;
  color: #388e3c;
}

.cat-action-btns {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.cat-btn {
  padding: 3px 12px;
  font-size: 14px;
  border-radius: 4px;
  border: none;
  background: #a5d6a7;
  color: #1b5e20;
  cursor: pointer;
  transition: background 0.18s;
}

.cat-btn:hover {
  background: #81c784;
}

.cat-btn.delete {
  background: #ffcdd2;
  color: #b71c1c;
}

.cat-btn.delete:hover {
  background: #e57373;
  color: #fff;
}
</style>
