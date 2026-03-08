import * as React from 'react'

import { formatModeLabel, formatPriorityLabel, formatStrategyLabel } from '@/lib/formatters'
import type { ActivityItem, AddPositionInput, DraftPosition, RecordSwapInput } from '@/types/meteora'

interface MvpStoreContextValue {
  activity: ActivityItem[]
  addPosition: (input: AddPositionInput) => DraftPosition
  closePosition: (positionId: string) => void
  collectPositionFees: (positionId: string) => DraftPosition | undefined
  positions: DraftPosition[]
  recordSwap: (input: RecordSwapInput) => void
}

const MvpStoreContext = React.createContext<MvpStoreContextValue | null>(null)

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function MvpStoreProvider({ children }: React.PropsWithChildren) {
  const [positions, setPositions] = React.useState<DraftPosition[]>([])
  const [activity, setActivity] = React.useState<ActivityItem[]>([])

  function pushActivity(item: Omit<ActivityItem, 'id' | 'createdAt'>) {
    setActivity((current) => [
      {
        ...item,
        createdAt: Date.now(),
        id: createId('activity'),
      },
      ...current,
    ])
  }

  function addPosition(input: AddPositionInput) {
    const depositUsd = input.depositedX * input.pool.token_x.price + input.depositedY * input.pool.token_y.price
    const position: DraftPosition = {
      id: createId('position'),
      ownerAddress: input.ownerAddress,
      poolAddress: input.pool.address,
      poolName: input.pool.name,
      tokenXSymbol: input.pool.token_x.symbol,
      tokenYSymbol: input.pool.token_y.symbol,
      depositedX: input.depositedX,
      depositedY: input.depositedY,
      depositUsd,
      apr: input.pool.apr,
      strategy: input.strategy,
      mode: input.mode,
      priorityLevel: input.priorityLevel,
      useJito: input.useJito,
      createdAt: Date.now(),
      lastCollectedAt: Date.now(),
      claimedFeesUsd: 0,
      status: 'Active',
      note: input.note,
    }

    setPositions((current) => [position, ...current])
    pushActivity({
      kind: 'liquidity',
      ownerAddress: input.ownerAddress,
      title: '新增仓位',
      subtitle: `${input.pool.name} · ${formatModeLabel(input.mode)} · ${formatStrategyLabel(input.strategy)}`,
    })

    return position
  }

  function collectPositionFees(positionId: string) {
    let updatedPosition: DraftPosition | undefined

    setPositions((current) =>
      current.map((position) => {
        if (position.id !== positionId || position.status !== 'Active') {
          return position
        }

        const elapsedMs = Math.max(Date.now() - position.lastCollectedAt, 0)
        const accruedFeesUsd = position.depositUsd * position.apr * (elapsedMs / (365 * 24 * 60 * 60 * 1000))

        updatedPosition = {
          ...position,
          claimedFeesUsd: position.claimedFeesUsd + accruedFeesUsd,
          lastCollectedAt: Date.now(),
        }

        return updatedPosition
      }),
    )

    if (updatedPosition) {
      pushActivity({
        kind: 'collect',
        ownerAddress: updatedPosition.ownerAddress,
        title: '收取费用',
        subtitle: updatedPosition.poolName,
      })
    }

    return updatedPosition
  }

  function closePosition(positionId: string) {
    let closedPosition: DraftPosition | undefined

    setPositions((current) =>
      current.map((position) => {
        if (position.id !== positionId || position.status === 'Closed') {
          return position
        }

        closedPosition = {
          ...position,
          status: 'Closed',
        }

        return closedPosition
      }),
    )

    if (closedPosition) {
      pushActivity({
        kind: 'close',
        ownerAddress: closedPosition.ownerAddress,
        title: '关闭仓位',
        subtitle: `${closedPosition.poolName} · ${formatPriorityLabel(closedPosition.priorityLevel)}`,
      })
    }
  }

  function recordSwap(input: RecordSwapInput) {
    pushActivity({
      kind: 'swap',
      ownerAddress: input.ownerAddress,
      title: '兑换',
      subtitle: `${input.direction === 'xToY' ? input.pool.token_x.symbol : input.pool.token_y.symbol} -> ${
        input.direction === 'xToY' ? input.pool.token_y.symbol : input.pool.token_x.symbol
      } · ${formatPriorityLabel(input.priorityLevel)}`,
    })
  }

  return (
    <MvpStoreContext.Provider
      value={{
        activity,
        addPosition,
        closePosition,
        collectPositionFees,
        positions,
        recordSwap,
      }}
    >
      {children}
    </MvpStoreContext.Provider>
  )
}

export function useMvpStore() {
  const context = React.use(MvpStoreContext)

  if (!context) {
    throw new Error('useMvpStore 必须在 MvpStoreProvider 内使用')
  }

  return context
}
