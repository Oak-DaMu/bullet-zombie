import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
	{
		path: '/',
		name: 'home',
		redirect: '/sub/game',
		component: () => import('@/views/HomeView.vue'),
	},
	{
		path: '/sub/game',
		name: 'game',
		component: () => import('@/views/Game/GameIndex.vue'),
	},
]
const router = createRouter({
	history: createWebHashHistory(),
	routes
})

router.beforeEach((to, from, next) => {
	next()
})

export default router
