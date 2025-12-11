## 关于 `HasPermission` 组件

- `HasPermission` 不是库自动提供的运行时组件，而是**由使用者自行在应用中全局注册/实现**的组件。
- 本插件/指令仅在编译阶段把 `v-hasPermission` 指令转换成 `<HasPermission>` 组件的形式（将权限作为 `:permission` 属性、把原元素作为默认插槽并根据 `fallback` 生成 `#fallback` 插槽）。
- 你需要在应用入口处注册自己的 `HasPermission` 组件，例如：

```js
// main.js
import { createApp } from "vue";
import App from "./App.vue";
import HasPermission from "./components/HasPermission.vue"; // 用户自定义实现

const app = createApp(App);
app.component("HasPermission", HasPermission);
app.mount("#app");
```

- 插件编译的规则：指令被替换成 `<HasPermission>`，并把原节点内容放入默认插槽，`fallback` 会被编译成 `#fallback` 插槽；如果你希望自定义 `HasPermission` 的行为（如禁用、隐藏、渲染自定义内容等），在该组件中实现对应逻辑即可。

注意：当你在 `fallback` 属性中传入 HTML 字符串（用于渲染复杂内容或组件），该字符串应为静态内容（不可依赖运行时动态属性），否则请使用插槽或绑定表达式来生成响应式内容。

## Fallback 使用方式 1 默认显示 /

```html
<div
  class="text"
  v-hasPermission.fallback="'example:permission:view'"
>
  文案
</div>
```

### 编译后：

```html
<hasPermission :permission="'example:permission:view'">
  <div class="text">文案</div>
  <template #fallback>/</template>
</hasPermission>
```

## Fallback 使用方式 2 自定义显示

```html
<div
  class="text"
  fallback="自定义文案"
  v-hasPermission.fallback="'example:permission:view'"
>
  文案
</div>
```

### 编译后：

```html
<hasPermission :permission="'example:permission:view'">
  <div class="text">文案</div>
  <template #fallback>自定义文案</template>
</hasPermission>
```

## Fallback 使用方式 3 响应式自定义显示

````html
<div
  class="text"
  :fallback="'自定义文案' + v"
  v-hasPermission.fallback="'example:permission:view'"
>
  文案
</div>

```html
<hasPermission :permission="'example:permission:view'">
  <div class="text">文案</div>
  <template #fallback>{{'自定义文案' + v}}</template>
</hasPermission>
````

## Fallback 使用方式 4 渲染 HTML，可以是 Vue 组件，但是 fallback 不能是动态属性

```html
<div
  class="text"
  fallback="<el-button>5 {{text}}</el-button>"
  v-hasPermission.fallback="'example:permission:view'"
>
  文案
</div>
```

### 编译后

```html
<hasPermission :permission="'example:permission:view'">
  <div class="text">文案</div>
  <template #fallback><el-button>5 {{text}}</el-button></template>
</hasPermission>
```

## 默认权限显示方式

```html
<div
  class="text"
  v-hasPermission="'example:permission:view'"
>
  文案
</div>
```

### 编译后

```html
<hasPermission :permission="'example:permission:view'">
  <div class="text">文案</div>
</hasPermission>
```

## 可以显示但是希望禁止操作

```html
<div
  class="text"
  v-hasPermission.link="'example:permission:view'"
>
  文案
</div>
```

### 编译后

```html
<hasPermission
  link
  :permission="'example:permission:view'"
>
  <div class="text">文案</div>
</hasPermission>
```
