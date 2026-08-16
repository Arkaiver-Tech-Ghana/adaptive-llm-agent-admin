import { EntityCrudPage, type EntityColumn } from '@/components/EntityCrudPage'
import { api, type MenuItem } from '@/lib/api'

const columns: EntityColumn<MenuItem>[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'price', label: 'Price', type: 'number', step: '0.01' },
  { key: 'stock_quantity', label: 'Stock', type: 'number' },
]

const emptyItem: MenuItem = { name: '', category: '', price: 0, stock_quantity: 0 }

export function MenuItemsPage() {
  return (
    <EntityCrudPage<MenuItem>
      title="Menu Items"
      idKey="name"
      columns={columns}
      emptyItem={emptyItem}
      list={api.listMenuItems}
      create={api.createMenuItem}
      update={api.updateMenuItem}
      remove={api.deleteMenuItem}
    />
  )
}
