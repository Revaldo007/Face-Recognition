import CrudPage from '../../components/CrudPage'

export default function Courses() {
  return (
    <CrudPage
      title="Courses" subtitle="Manage courses offered" itemName="course" endpoint="/courses"
      lookups={{ departments: { endpoint: '/departments', label: (d) => d.name } }}
      columns={[
        { key: 'name', label: 'Course Name' },
        { key: 'code', label: 'Code' },
        { key: 'department_name', label: 'Department' },
        { key: 'duration', label: 'Duration' },
      ]}
      fields={[
        { name: 'name', label: 'Course Name', required: true },
        { name: 'code', label: 'Course Code', required: true },
        { name: 'department_id', label: 'Department', type: 'select', lookup: 'departments', required: true, numeric: true },
        { name: 'duration', label: 'Duration', placeholder: 'e.g. 2 Years' },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
    />
  )
}
