import CrudPage from '../../components/CrudPage'

export default function Departments() {
  return (
    <CrudPage
      title="Departments" subtitle="Manage college departments" itemName="department" endpoint="/departments"
      columns={[
        { key: 'name', label: 'Department Name' },
        { key: 'code', label: 'Code' },
        { key: 'description', label: 'Description' },
      ]}
      fields={[
        { name: 'name', label: 'Department Name', required: true },
        { name: 'code', label: 'Department Code', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
    />
  )
}
