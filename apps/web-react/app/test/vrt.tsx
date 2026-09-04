import type { ReactElement } from 'react'
import { render } from '@testing-library/react'

/**
 * 切换文档级主题。
 * app.css 的 `@custom-variant dark (&:is(.dark *))` 与 `.dark {}` token 覆盖
 * 都以「.dark 打在 html 上」为前提（token 从根继承给所有后代），
 * 与真实 app 的主题机制完全一致。
 */
export function setTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
}

/**
 * 渲染组件并包一层截图目标容器：
 * - data-testid 供 `page.getByTestId('vrt-target')` 精确定位，只截组件本体
 * - 自带 bg-background/text-foreground（随主题切换 token），避免透明背景截图
 * - 可选固定宽度：让流式布局（w-full + max-w-*）的截图尺寸确定
 */
export function renderTarget(element: ReactElement, options: { width?: number } = {}) {
  return render(
    <div
      data-testid="vrt-target"
      className="inline-block bg-background p-4 text-foreground"
      style={options.width ? { width: `${options.width}px` } : undefined}
    >
      {element}
    </div>,
  )
}
