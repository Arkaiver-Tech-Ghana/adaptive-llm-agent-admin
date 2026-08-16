import { EntityCrudPage, type EntityColumn } from '@/components/EntityCrudPage'
import { api, type Room } from '@/lib/api'

const columns: EntityColumn<Room>[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'room_type', label: 'Type', type: 'text' },
  { key: 'price_per_night', label: 'Price / night', type: 'number', step: '0.01' },
  { key: 'availability_count', label: 'Available', type: 'number' },
]

const emptyItem: Room = { name: '', room_type: '', price_per_night: 0, availability_count: 0 }

export function RoomsPage() {
  return (
    <EntityCrudPage<Room>
      title="Rooms"
      idKey="name"
      columns={columns}
      emptyItem={emptyItem}
      list={api.listRooms}
      create={api.createRoom}
      update={api.updateRoom}
      remove={api.deleteRoom}
    />
  )
}
