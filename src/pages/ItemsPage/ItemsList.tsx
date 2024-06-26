import styled from 'styled-components'
import useSWRInfinite from 'swr/infinite'
import { useAjax } from '../../lib/ajax'
import type { Time } from '../../lib/time'
import { time } from '../../lib/time'
interface Props {
  start: Time
  end: Time
}
const Div = styled.div`
  padding: 16px;
  text-align: center;
`
export const ItemsList: React.FC<Props> = (props) => {
  const { start, end } = props
  const { get } = useAjax()
  const getKey = (pageIndex: number, prev: Resources<Item>) => {
    if (prev) {
      const sendCount = (prev.pager.page - 1) * prev.pager.per_page + prev.resources.length
      const count = prev.pager.count
      if (sendCount >= count) { return null }
    }
    return `/api/v1/items?page=${pageIndex + 1}&`
      + `happened_after=${start.removeTime().isoString}&`
      + `happened_before=${end.removeTime().isoString}`
  }
  const { data, error, size, setSize } = useSWRInfinite(
    getKey,
    async path => (await get<Resources<Item>>(path)).data,
    { revalidateAll: true }
  )
  const onLoadMore = () => {
    setSize(size + 1)
  }
  const isLoadingInitialData = !data && !error
  const isLoadingMore = data?.[size - 1] === undefined && !error
  const isLoading = isLoadingInitialData || isLoadingMore
  if (!data) {
    return <div>
      {error && <Div>数据加载失败，请刷新页面</Div>}
      {isLoading && <Div>数据加载中...</Div>}
    </div>
  } else {
    const last = data[data.length - 1]
    const { page, per_page, count } = last.pager
    const hasMore = (page - 1) * per_page + last.resources.length < count
    return <>
      <ol>{
        data.map(({ resources }) => {
          return resources.map(item =>
            <li key={item.id} grid grid-cols="[auto_1fr_auto]" grid-rows-2 px-16px py-8px gap-x-12px
              border-b-1 b-solid b="#EEE">
              <div row-start-1 col-start-1 row-end-3 col-end-2 text-24px w-48px h-48px
                bg="#D8D8D8" rounded="50%" flex justify-center items-center>
                {item.tags?.[0].sign}
              </div>
              <div row-start-1 col-start-2 row-end-2 col-end-3>
                {item.tags?.[0].name}
              </div>
              <div row-start-2 col-start-2 row-end-3 col-end-4 text="#999999">
                {time(item.happen_at).format('yyyy-MM-dd HH:mm')}
              </div>
              <div row-start-1 col-start-3 row-end-2 col-end-4 text="#53A867">
                ￥{item.amount / 100}
              </div>
            </li>
          )
        })
      }</ol>
      {error && <Div>数据加载失败，请刷新页面</Div>}
      {!hasMore
        ? <Div>没有更多数据了</Div>
        : isLoading
          ? <Div>数据加载中...</Div>
          : <Div><button j-btn onClick={onLoadMore}>加载更多</button></Div>}
    </>
  }
}
