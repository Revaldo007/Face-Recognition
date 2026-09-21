import CrudPage from '../../components/CrudPage'

export default function Faculty() {
  return (
    <CrudPage
      title="Faculty" subtitle="Manage faculty members" itemName="faculty" endpoint="/faculty"
      lookups={{ departments: { endpoint: '/departments', label: (d) => d.name } }}
      columns={[
        { key: 'faculty_id', label: 'Faculty ID' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'department_name', label: 'Department' },
        { key: 'designation', label: 'Designation' },
      ]}
      fields={[
        { name: 'faculty_id', label: 'Faculty ID', required: true },
        { name: 'name', label: 'Name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone' },
        { name: 'department_id', label: 'Department', type: 'select', lookup: 'departments', required: true, numeric: true },
        { name: 'designation', label: 'Designation' },
        { name: 'password', label: 'Password', type: 'password', required: true },
      ]}
    />
  )
}
