import { useEffect, useMemo, useState } from 'react'
import api, { errorMessage } from '../services/api'
import { Alert, Modal, PageHeader } from './ui'

/**
 * One reusable "list + search + add/edit modal + delete" page.
 * The admin pages (Students, Faculty, Departments, Courses, Subjects) only describe
 * their columns and form fields - this component does the work.
 *
 * fields: [{ name, label, type: text|email|number|password|select|textarea, required, createOnly,
 *            options: [{value,label}]  OR  lookup: 'departments' }]
 * lookups: { departments: { endpoint: '/departments', label: (d) => d.name } }
 */
export default function CrudPage({ title, subtitle, itemName, endpoint, columns, fields, lookups = {}, defaults = {} }) {
  const [rows, setRows] = useState([])
  const [options, setOptions] = useState({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)      // null | { mode: 'create' | 'edit', row }
  const [form, setForm] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setRows((await api.get(endpoint)).data)
      setError('')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // load dropdown options (departments, courses, ...)
    Object.entries(lookups).forEach(async ([key, cfg]) => {
      try {
        const data = (await api.get(cfg.endpoint)).data
        setOptions((o) => ({ ...o, [key]: data.map((d) => ({ value: d.id, label: cfg.label(d) })) }))
      } catch { /* ignore */ }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q)))
  }, [rows, search])

  const openCreate = () => {
    setForm({ ...defaults })
    setFormError('')
    setModal({ mode: 'create' })
  }
  const openEdit = (row) => {
    const values = {}
    fields.forEach((f) => { values[f.name] = f.type === 'password' ? '' : row[f.name] ?? '' })
    setForm(values)
    setFormError('')
    setModal({ mode: 'edit', row })
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    const payload = {}
    fields.forEach((f) => {
      if (modal.mode === 'edit' && f.createOnly) return
      let v = form[f.name]
      if (f.type === 'password' && modal.mode === 'edit' && !v) return   // blank = keep old password
      if (v === '' || v === undefined) v = f.required ? '' : null
      else if (f.type === 'number' || f.numeric) v = Number(v)
      payload[f.name] = v
    })
    try {
      if (modal.mode === 'create') await api.post(endpoint, payload)
      else await api.put(`${endpoint}/${modal.row.id}`, payload)
      setModal(null)
      load()
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row) => {
    if (!window.confirm(`Delete this ${itemName}?`)) return
    try {
      await api.delete(`${endpoint}/${row.id}`)
      load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle}>
        <input className="input !w-56" placeholder={`Search ${itemName}...`} value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-primary" onClick={openCreate}>+ Add {itemName}</button>
      </PageHeader>

      <Alert>{error}</Alert>

      <div className="card mt-3 overflow-x-auto !p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((c) => <th key={c.key} className="th">{c.label}</th>)}
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td className="td text-center text-slate-500" colSpan={columns.length + 1}>Loading...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td className="td text-center text-slate-500" colSpan={columns.length + 1}>No {itemName} found.</td></tr>}
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                {columns.map((c) => <td key={c.key} className="td">{c.render ? c.render(row) : row[c.key] ?? '-'}</td>)}
                <td className="td whitespace-nowrap text-right">
                  <button className="mr-3 text-sm font-medium text-indigo-600 hover:underline" onClick={() => openEdit(row)}>Edit</button>
                  <button className="text-sm font-medium text-rose-600 hover:underline" onClick={() => remove(row)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={`${modal.mode === 'create' ? 'Add' : 'Edit'} ${itemName}`} onClose={() => setModal(null)} wide>
          <form onSubmit={save} className="space-y-4">
            <Alert>{formError}</Alert>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => {
                if (modal.mode === 'edit' && f.createOnly) return null
                const opts = f.options || options[f.lookup] || []
                const common = {
                  className: 'input', value: form[f.name] ?? '',
                  onChange: (e) => setForm({ ...form, [f.name]: e.target.value }),
                  required: f.required && !(f.type === 'password' && modal.mode === 'edit'),
                }
                return (
                  <div key={f.name} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                    <label className="label">{f.label}{f.required && ' *'}</label>
                    {f.type === 'select' ? (
                      <select {...common}>
                        <option value="">{f.required ? 'Select...' : 'None'}</option>
                        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea {...common} rows={3} />
                    ) : (
                      <input {...common} type={f.type || 'text'} min={f.type === 'number' ? 1 : undefined}
                        placeholder={f.type === 'password' && modal.mode === 'edit' ? 'Leave blank to keep current' : f.placeholder} />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
