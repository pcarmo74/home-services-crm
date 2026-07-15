'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Contact {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  source: string
  tags: string[]
  notes: string
  createdAt: string
}

const SOURCES = ['form', 'phone', 'referral', 'website', 'other']

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'form',
    notes: '',
  })

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/contacts`
        )
        if (res.ok) {
          const data = await res.json()
          setContacts(data.contacts || [])
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error)
        toast.error('Failed to load contacts')
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [])

  // Create new contact
  const createContact = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/contacts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      )

      if (res.ok) {
        const newContact = await res.json()
        setContacts([newContact, ...contacts])
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          source: 'form',
          notes: '',
        })
        setShowNewForm(false)
        toast.success('Contact created!')
      }
    } catch (error) {
      console.error('Failed to create contact:', error)
      toast.error('Failed to create contact')
    }
  }

  // Delete contact
  const deleteContact = async (id: string) => {
    if (!confirm('Are you sure?')) return

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/contacts/${id}`,
        { method: 'DELETE' }
      )

      if (res.ok) {
        setContacts(contacts.filter((c) => c.id !== id))
        toast.success('Contact deleted')
      }
    } catch (error) {
      console.error('Failed to delete contact:', error)
      toast.error('Failed to delete contact')
    }
  }

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="p-8">Loading contacts...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">Contacts</h1>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          <Plus size={20} />
          New Contact
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-500"
        />
      </div>

      {/* Contacts Table */}
      <div className="rounded-lg border border-slate-700 bg-slate-800">
        {filteredContacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-700 bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-slate-700 hover:bg-slate-700/50"
                  >
                    <td className="px-6 py-4 font-semibold">{contact.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {contact.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {contact.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {contact.company || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded bg-slate-700 px-2 py-1 text-xs capitalize">
                        {contact.source}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => deleteContact(contact.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">
            No contacts found. Create your first contact!
          </div>
        )}
      </div>

      {/* New Contact Form Modal */}
      {showNewForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowNewForm(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-slate-600 bg-slate-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-2xl font-bold">Create New Contact</h2>

            <form onSubmit={createContact} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  placeholder="555-1234"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Company
                </label>
                <input
                  type="text"
                  placeholder="ACME Corp"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Notes
                </label>
                <textarea
                  placeholder="Add any notes..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 mt-4"
              >
                Create Contact
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}