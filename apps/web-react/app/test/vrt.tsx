import type { ScreenshotMatcherOptions } from '@vitest/browser/context'
import type { ReactElement } from 'react'
import type { Locator } from 'vitest/browser'
import { render } from '@testing-library/react'
import { expect } from 'vitest'
import { page } from 'vitest/browser'

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
      style={options.width
        ? { width: `${options.width}px` }
        : undefined}
    >
      {element}
    </div>,
  )
}

/**
 * 文案是「内容」不是「视觉」：像素基线只守布局 / 配色 / 图标几何，
 * 文案由 RTL 断言覆盖。遮掉文本块后，改一句 UI 文案不再需要重生成所有基线。
 *
 * 选择 `p` / `button` 而不是 `getByText`：getByText 依赖当前文案，
 * 文案一改 locator 就失效，遮罩必须在文案变化后仍然稳定。
 *
 * `[data-vrt-mask]` 用于包住「宽度随文案变化」的控件（如按钮行）：
 * 只遮按钮会因文案长短改变遮罩框宽度而误报，遮整宽的行才是稳定区域。
 */
export function maskText(root: Locator = page.getByTestId('vrt-target')): Locator[] {
  return Array.from(root.element().querySelectorAll('p, button, [data-vrt-mask]'))
    .map(element => page.elementLocator(element))
}

// Vitest 5 运行时支持 Playwright 的 mask（@vitest/browser 内部 ScreenshotMatcherArguments
// 已声明），但公开的 ScreenshotMatcherOptions 类型还没暴露。集中在这里断言一次，
// 避免每个用例各自处理类型；等上游公开后删掉这个类型和断言即可。
type ScreenshotOptionsWithMask = ScreenshotMatcherOptions & {
  screenshotOptions?: ScreenshotMatcherOptions['screenshotOptions'] & { mask?: Locator[] }
}

/** 带文本遮罩的截图断言；未传 mask 时等价于直接调用 toMatchScreenshot。 */
export function expectScreenshot(locator: Locator, name: string, mask?: Locator[]): Promise<void> {
  const options = mask?.length
    ? {
        screenshotOptions: { mask },
      } as ScreenshotOptionsWithMask
    : undefined
  return expect(locator).toMatchScreenshot(name, options) as Promise<void>
}
