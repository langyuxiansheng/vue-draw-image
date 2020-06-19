import Vue from 'vue';
import App from './App.vue';
import VueDrawImage from '../packages';
Vue.use(VueDrawImage);
Vue.config.productionTip = false;
new Vue({
    render: h => h(App),
}).$mount('#app');
