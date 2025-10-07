<template>
  <div class="admin-home-layout">
    <AdminNav />
    <div class="admin-home">
      <h2>首頁輪播圖管理</h2>
      <div class="carousel-preview">
        <div v-if="activeBanners.length" class="carousel">
          <div v-for="banner in activeBanners" :key="banner.id" class="carousel-item">
            <img :src="banner.imageUrl" :alt="banner.title" class="carousel-img" />
            <div class="carousel-title">{{ banner.title }}</div>
          </div>
        </div>
        <div v-else class="empty-tip">目前沒有啟用的輪播圖</div>
      </div>
      <div class="banner-table">
        <div class="table-actions">
          <button type="button" class="create-btn" @click="showCreateModal = true">新增輪播圖</button>
          <button type="button" class="save-btn" @click="saveAllBanners">儲存</button>
        </div>
        <form @submit.prevent="saveAllBanners">
          <h4 style="color:#388e3c;margin-bottom:8px;">啟用輪播圖</h4>
          <table v-if="bannersDraft.filter(b => b.isActive).length">
            <thead>
              <tr>
                <th>預覽</th>
                <th>標題</th>
                <th>排序</th>
                <th>啟用</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(banner, idx) in bannersDraft.filter(b => b.isActive)" :key="banner.id">
                <td>
                  <img v-if="banner.imageUrl" :src="banner.imageUrl" alt="banner" class="banner-img" />
                  <span v-else class="empty-tip">無圖片</span>
                </td>
                <td>
                  <input v-model="banner.title" type="text" style="width:120px;" />
                </td>
                <td>
                  <input type="number" v-model.number="banner.sortOrder" min="1" style="width:60px;" />
                </td>
                <td>
                  <input type="checkbox" v-model="banner.isActive" @change="updatePreview" />
                </td>
                <td>
                  <button type="button" @click="deleteBanner(banner.id)">刪除</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-tip">暫無啟用輪播圖</div>

          <h4 style="color:#888;margin:24px 0 8px 0;">未啟用輪播圖</h4>
          <table v-if="bannersDraft.filter(b => !b.isActive).length">
            <thead>
              <tr>
                <th>預覽</th>
                <th>標題</th>
                <th>排序</th>
                <th>啟用</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(banner, idx) in bannersDraft.filter(b => !b.isActive)" :key="banner.id">
                <td>
                  <img v-if="banner.imageUrl" :src="banner.imageUrl" alt="banner" class="banner-img" />
                  <span v-else class="empty-tip">無圖片</span>
                </td>
                <td>
                  <input v-model="banner.title" type="text" style="width:120px;" />
                </td>
                <td>
                  <input type="number" v-model.number="banner.sortOrder" min="1" style="width:60px;" />
                </td>
                <td>
                  <input type="checkbox" v-model="banner.isActive" @change="updatePreview" />
                </td>
                <td>
                  <button type="button" @click="deleteBanner(banner.id)">刪除</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-tip">暫無未啟用輪播圖</div>
        </form>
      </div>
      <hr style="margin:24px 0;" />
      <!-- 新增輪播圖 Modal -->
      <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
        <div class="modal-content">
          <h3 style="margin-bottom:16px;">新增輪播圖</h3>
          <form @submit.prevent="handleCreateBanner" class="create-banner-form">
            <input type="file" @change="onFileChange" accept="image/*" />
            <input v-model="newBannerTitle" type="text" placeholder="標題" required style="width:120px;" />
            <input v-model.number="newBannerSortOrder" type="number" min="1" placeholder="排序" required style="width:60px;" />
            <label>
              <input type="checkbox" v-model="newBannerActive" /> 啟用
            </label>
            <button type="submit" :disabled="!selectedFile || uploading" class="save-btn">新增</button>
            <button type="button" @click="showCreateModal = false" class="cancel-btn">取消</button>
          </form>
          <div v-if="uploading" style="color:#388e3c;margin-bottom:8px;">圖片上傳中...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import AdminNav from '../components/AdminNav.vue';
import { basic_url } from '../config';

const banners = ref([]);
const bannersDraft = ref([]);
const images = ref([]);
const selectedFile = ref<File|null>(null);
const newBannerTitle = ref('');
const newBannerSortOrder = ref(1);
const newBannerActive = ref(false);
const uploading = ref(false);
const showCreateModal = ref(false);

const getAuthHeader = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fetchBanners = async () => {
  const res = await axios.get(`${basic_url}/admin/banners/manage`, {
    headers: getAuthHeader()
  });
  banners.value = res.data;
  bannersDraft.value = res.data.map(b => ({ ...b }));
};
const fetchImages = async () => {
  const res = await axios.get(`${basic_url}/admin/banners/images`, {
    headers: getAuthHeader()
  });
  images.value = res.data;
};
onMounted(() => {
  fetchBanners();
  fetchImages();
});

const activeBanners = computed(() =>
  bannersDraft.value.filter(b => b.isActive)
);

const updatePreview = () => {
  // 只為觸發 activeBanners 即時更新
};

const saveAllBanners = async () => {
  const authHeader = getAuthHeader();
  if (!authHeader.Authorization) {
    alert('請先登入管理員');
    window.location.href = '/admin/login';
    return;
  }
  try {
    for (const banner of bannersDraft.value) {
      await axios.put(`${basic_url}/admin/banners/${banner.id}`, {
        title: banner.title ?? '',
        sortOrder: banner.sortOrder ?? 1,
        isActive: !!banner.isActive
      }, {
        headers: authHeader
      })
      .catch(err => {
        if (err.response && (err.response.status === 302 || err.response.status === 401)) {
          alert('登入已過期，請重新登入');
          window.location.href = '/admin/login';
          throw err;
        }
        throw err;
      });
    }
    fetchBanners();
    alert('儲存成功');
  } catch (e) {
    alert('儲存失敗');
  }
};

const deleteBanner = async (id: number) => {
  if (!confirm('確定要刪除嗎？')) return;
  try {
    await axios.delete(`${basic_url}/admin/banners/${id}`, {
      headers: getAuthHeader()
    });
    fetchBanners();
    fetchImages();
  } catch (e) {
    alert('刪除失敗');
  }
};

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    selectedFile.value = file;
  }
};

const handleCreateBanner = async () => {
  if (!selectedFile.value) return;
  uploading.value = true;
  try {
    // 步驟1：取得 S3 上傳網址
    const { uploadUrl, fileUrl } = await axios.post(
      `${basic_url}/api/upload/get-presigned-url`,
      {
        fileName: selectedFile.value.name,
        fileType: selectedFile.value.type,
        type: 'banner'
      },
      { headers: getAuthHeader() }
    ).then(res => res.data);

    // 步驟2：PUT 檔案到 S3
    await axios.put(uploadUrl, selectedFile.value, {
      headers: { 'Content-Type': selectedFile.value.type }
    });

    // 步驟3：新增輪播圖
    await axios.post(
      `${basic_url}/admin/banners/upload`,
      {
        title: newBannerTitle.value,
        sortOrder: newBannerSortOrder.value,
        isActive: newBannerActive.value,
        imageUrl: fileUrl
      },
      { headers: getAuthHeader() }
    );

    // 重置表單
    selectedFile.value = null;
    newBannerTitle.value = '';
    newBannerSortOrder.value = 1;
    newBannerActive.value = false;

    fetchBanners();
    alert('新增成功');
  } catch (e) {
    alert('新增失敗');
  } finally {
    uploading.value = false;
  }
};
</script>

<style scoped>
.admin-home-layout {
  display: flex;
}
.admin-home {
  flex: 1;
  padding: 32px;
  margin-left: 220px;
  font-family: 'Segoe UI', 'Microsoft JhengHei', Arial, sans-serif;
  background: #f9fafb;
}
.carousel-preview {
  margin-bottom: 24px;
}
.carousel {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}
.carousel-item {
  min-width: 160px;
  background: #f1f8e9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(56,142,60,0.08);
  padding: 8px;
  text-align: center;
}
.carousel-img {
  width: 120px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 4px;
}
.carousel-title {
  font-size: 16px;
  color: #388e3c;
  font-weight: 700;
  letter-spacing: 1px;
}
.banner-table {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(56,142,60,0.08);
  padding: 24px 20px 16px 20px;
  margin-bottom: 24px;
}
.banner-table h4 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}
.banner-table table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  font-size: 15px;
}
.banner-table th {
  background: #e8f5e9;
  color: #388e3c;
  font-size: 16px;
  font-weight: 700;
  padding: 10px 0;
}
.banner-table td {
  border: 1px solid #b2dfdb;
  padding: 10px 0;
  text-align: center;
  font-size: 15px;
}
.banner-img {
  width: 80px;
  height: 40px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
input[type="text"], input[type="number"] {
  font-size: 15px;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #b2dfdb;
  background: #f5f5f5;
  width: 100%;
  box-sizing: border-box;
}
input[type="checkbox"] {
  transform: scale(1.2);
  margin: 0 4px;
}
.table-actions {
  text-align: right;
  margin-bottom: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.table-actions button {
  font-size: 16px;
  font-weight: 600;
  padding: 8px 24px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  min-width: 120px;
  height: 40px;
  box-sizing: border-box;
  transition: background 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.table-actions .save-btn {
  background: #388e3c;
  color: #fff;
}
.table-actions .save-btn:hover {
  background: #2e7d32;
  box-shadow: 0 2px 8px rgba(56,142,60,0.18);
}
.table-actions .create-btn {
  background: #1976d2;
  color: #fff;
}
.table-actions .create-btn:hover {
  background: #1565c0;
  box-shadow: 0 2px 8px rgba(25,118,210,0.18);
}
.banner-table button {
  font-size: 15px;
  padding: 6px 18px;
  border-radius: 4px;
  border: none;
  background: #e57373;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}
.banner-table button:hover {
  background: #c62828;
}
.empty-tip {
  color: #888;
  padding: 32px 0;
  text-align: center;
  font-size: 17px;
}
.modal-content {
  background: #fff;
  border-radius: 10px;
  padding: 32px 24px 24px 24px;
  min-width: 340px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.18);
  position: relative;
  font-size: 16px;
}
.create-banner-form input[type="file"] {
  font-size: 15px;
}
.create-banner-form input[type="text"],
.create-banner-form input[type="number"] {
  font-size: 15px;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #b2dfdb;
  background: #f5f5f5;
  width: 120px;
  box-sizing: border-box;
}
.create-banner-form label {
  font-size: 15px;
  margin-left: 8px;
}
.save-btn, .cancel-btn {
  font-size: 16px;
  font-weight: 600;
  padding: 8px 24px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  min-width: 120px;
  height: 40px;
  box-sizing: border-box;
}
.cancel-btn {
  background: #eee;
  color: #333;
  margin-left: 8px;
}
.cancel-btn:hover {
  background: #ccc;
}
</style>
