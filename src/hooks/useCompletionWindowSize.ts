import { useCallback } from 'react'
import { useTerminalSize } from '@hooks/useTerminalSize'

export interface CompletionWindowSize {
  windowSize: number
  maxVisibleItems: number
  availableHeight: number
  isCompactMode: boolean
}

// UI元素占用的固定行数
const RESERVED_SPACE = {
  inputLine: 2,        // 输入行 + 边框
  helpText: 2,         // 帮助文本框
  indicators: 1,       // 滚动指示器
  padding: 2,          // 上下边距
  statusMessages: 1,   // 状态消息空间
}

const TOTAL_RESERVED_SPACE = Object.values(RESERVED_SPACE).reduce((sum, space) => sum + space, 0)

// 响应式断点
const BREAKPOINTS = {
  compact: 15,    // 15行以下启用紧凑模式
  standard: 25,  // 25行标准模式
  large: 40,     // 40行以上增强模式
} as const

// 窗口大小限制
const WINDOW_LIMITS = {
  minimum: 3,     // 最少显示3个项目
  maximum: 15,    // 最多显示15个项目
  compact: 5,     // 紧凑模式最多5个项目
} as const

/**
 * 动态计算补全窗口的最佳大小
 *
 * 根据终端高度、UI元素占用空间和响应式断点计算最优的窗口大小
 */
export function useCompletionWindowSize(): CompletionWindowSize {
  const { rows } = useTerminalSize()

  const calculateWindowSize = useCallback((terminalRows: number): CompletionWindowSize => {
    // 计算可用于列表的行数
    const availableHeight = Math.max(3, terminalRows - TOTAL_RESERVED_SPACE)

    // 确定响应式模式
    const isCompactMode = terminalRows < BREAKPOINTS.compact

    // 根据模式设置窗口大小限制
    let maxWindow: number
    if (isCompactMode) {
      maxWindow = WINDOW_LIMITS.compact
    } else {
      maxWindow = WINDOW_LIMITS.maximum
    }

    // 计算最终窗口大小
    let windowSize: number
    if (terminalRows < 10) {
      // 极小终端：使用最小值
      windowSize = WINDOW_LIMITS.minimum
    } else if (terminalRows > BREAKPOINTS.large) {
      // 大终端：适当增加显示数量，但不超过最大值
      const suggestedSize = Math.floor(availableHeight * 0.7) // 使用70%的可用空间
      windowSize = Math.min(suggestedSize, maxWindow)
    } else {
      // 中等终端：根据可用空间计算
      windowSize = Math.min(availableHeight, maxWindow)
    }

    // 确保在合理范围内
    windowSize = Math.max(WINDOW_LIMITS.minimum, Math.min(windowSize, maxWindow))

    return {
      windowSize,
      maxVisibleItems: availableHeight,
      availableHeight,
      isCompactMode
    }
  }, [])

  return calculateWindowSize(rows)
}