import CrudPage from '../../components/CrudPage'

export default function Subjects() {
  return (
    <CrudPage
      title="Subjects" subtitle="Manage subjects and assign faculty" itemName="subject" endpoint="/subjects"
      lookups={{
        departments: { endpoint: '/departments', label: (d) => d.name },
        courses: { endpoint: '/courses', label: (c) => `${c.name} (${c.code})` },
        faculty: { endpoint: '/faculty', label: (f) => f.name },
      }}
      columns={[
        { key: 'name', label: 'Subject' },
        { key: 'code', label: 'Code' },
        { key: 'course_name', label: 'Course' },
        { key: 'semester', label: 'Semester' },
        { key: 'faculty_name', label: 'Faculty' },
      ]}
      fields={[
        { name: 'name', label: 'Subject Name', required: true },
        { name: 'code', label: 'Subject Code', required: true },
        { name: 'course_id', label: 'Course', type: 'select', lookup: 'courses', required: true, numeric: true },
        { name: 'department_id', label: 'Department', type: 'select', lookup: 'departments', required: true, numeric: true },
        { name: 'semester', label: 'Semester', type: 'number', required: true },
        { name: 'faculty_id', label: 'Faculty', type: 'select', lookup: 'faculty', numeric: true },
      ]}
    />
  )
}
