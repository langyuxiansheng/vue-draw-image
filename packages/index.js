// 导入组件，组件必须声明 name
import VueDrawImage from './VueDrawImage';
// 为组件添加 install 方法，用于按需引入
VueDrawImage.install = function (Vue) {
    Vue.component(VueDrawImage.name, VueDrawImage);
}
export default VueDrawImage;
