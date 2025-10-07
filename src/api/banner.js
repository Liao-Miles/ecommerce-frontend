// Banner API
import axios from 'axios';
import { basic_url } from '../config';

const bannerAxios = axios.create({
  baseURL: basic_url,
});

export async function fetchBanners() {
  const response = await bannerAxios.get('/api/banners');
  return response.data;
}
