import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ProductList from '../views/ProductList.vue'
import ProductDetail from '../views/ProductDetail.vue'
import Cart from '../views/Cart.vue'
import Checkout from '../views/Checkout.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import AdminLogin from '../views/AdminLogin.vue'
import ForgotPassword from '../views/ForgotPassword.vue'
import ResetPassword from '../views/ResetPassword.vue'

const AdminDashboard = () => import('../views/AdminDashboard.vue');
const AdminProducts = () => import('../views/AdminProducts.vue');
const AdminOrders = () => import('../views/AdminOrders.vue');
const AdminUsers = () => import('../views/AdminUsers.vue');

const routes = [
    { path: '/', component: Home },
    { path: '/products', component: ProductList },
    { path: '/products/:id', component: ProductDetail, props: true },
    { path: '/cart', component: Cart },
    { path: '/checkout', name: 'Checkout', component: Checkout },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/forgot-password', component: ForgotPassword },
    { path: '/reset-password', component: ResetPassword },
    { path: '/admin/login', component: AdminLogin },
    { path: '/admin/dashboard', component: AdminDashboard },
    { path: '/admin/products', component: AdminProducts },
    { path: '/admin/orders', component: AdminOrders },
    { path: '/admin/users', component: AdminUsers },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
