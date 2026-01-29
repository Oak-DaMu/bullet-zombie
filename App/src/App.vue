<script setup>
/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { RouterView } from 'vue-router';
import { NNotificationProvider } from 'naive-ui';

</script>

<template>
	<n-notification-provider>
		<RouterView />
	</n-notification-provider>
</template>

<style scoped></style>
