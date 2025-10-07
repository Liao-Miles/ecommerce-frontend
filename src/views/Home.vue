<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchBanners } from '../api/banner';
import { basic_url } from '../config';

const banners = ref<any[]>([]);
const current = ref(0);
let intervalId: any = null;

const next = () => {
  current.value = (current.value + 1) % banners.value.length;
};
const prev = () => {
  current.value = (current.value - 1 + banners.value.length) % banners.value.length;
};

onMounted(async () => {
  try {
    banners.value = await fetchBanners();
    if (banners.value.length > 1) {
      intervalId = setInterval(next, 3000);
    }
  } catch (e) {
    banners.value = [];
  }
});

function getBannerImg(banner: any) {
  if (banner && banner.imageUrl && typeof banner.imageUrl === 'string' && banner.imageUrl.trim() !== '') {
    return banner.imageUrl;
  }
  return '/assets/default-banner.jpg';
}
</script>

<template>
  <div v-if="banners.length" class="carousel">
    <div class="carousel-inner">
      <img
        :src="getBannerImg(banners[current])"
        :alt="banners[current].title || 'Banner'"
        class="carousel-img"
      />
      <button v-if="banners.length > 1" class="carousel-btn prev" @click="prev">&#8592;</button>
      <button v-if="banners.length > 1" class="carousel-btn next" @click="next">&#8594;</button>
    </div>
    <div class="carousel-indicators">
      <span v-for="(banner, idx) in banners" :key="idx" :class="{ active: idx === current }" @click="current = idx"></span>
    </div>
  </div>
  <div v-else class="carousel-placeholder">No banners available.</div>
</template>

<style scoped>
.carousel {
  position: relative;
  width: 100vw;
  max-width: 100vw;
  margin: 10px 0 2rem 0; /* 60px for navbar height */
  overflow: hidden;
  left: 50%;
  right: 50%;
  transform: translateX(-50%);
}
.carousel-inner {
  position: relative;
}
.carousel-img {
  width: 100vw;
  height: 600px;
  object-fit: cover;
  border-radius: 0;
}
.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.4);
  color: #fff;
  border: none;
  font-size: 2rem;
  padding: 0 1rem;
  cursor: pointer;
  z-index: 2;
}
.carousel-btn.prev { left: 10px; }
.carousel-btn.next { right: 10px; }
.carousel-indicators {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}
.carousel-indicators span {
  display: inline-block;
  width: 10px;
  height: 10px;
  background: #ccc;
  border-radius: 50%;
  margin: 0 4px;
  cursor: pointer;
}
.carousel-indicators .active {
  background: #333;
}
.carousel-placeholder {
  text-align: center;
  color: #888;
  padding: 2rem 0;
}
</style>