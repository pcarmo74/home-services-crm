'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Property {
  id: string
  contact_id: string
  address: string
  city: string
  province: string
  postal_code?: string
  notes: string
  created_at: string
}

interface Contact {
  id: string
  name: string
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    contactId: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    notes: '',
  })

  // Fetch properties and contacts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propertiesRes, contactsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contacts`),
        ])

        if (propertiesRes.ok) {
          const data = await propertiesRes.json()
          setProperties(data.properties || [])
        }

        if (contactsRes.ok) {
          const data = await contactsRes.json()
          setContacts(data.contacts || [])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load properties')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Create new property
  const createProperty = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.contactId || !formData.address || !formData.city) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/properties`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactId: formData.contactId,
            address: formData.address,
            city: formData.city,
            province: formData.province,
            postalCode: formData.postalCode,
            notes: formData.notes,
          }),
        }
      )

      if (res.ok) {
        const newProperty = await res.json()
        setProperties([newProperty, ...properties])
        setFormData({
          contactId: '',
          address: '',
          city: '',
          province: '',
          postalCode: '',
          notes: '',
        })
        setShowNewForm(false)
        toast.success('Property created!')
      } else {
        const errorData = await res.json()
        toast.error(errorData.details || 'Failed to create property')
      }
    } catch (error) {
      console.error('Failed to create property:', error)
      toast.error('Failed to create property')
    }
  }

  // Delete property
  const deleteProperty = async (id: string) => {
    if (!confirm('Are you sure?')) return

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/properties/${id}`,
        { method: 'DELETE' }
      )

      if (res.ok) {
        setProperties(properties.filter((p) => p.id !== id))
        toast.success('Property deleted')
      }
    } catch (error) {
      console.error('Failed to delete property:', error)
      toast.error('Failed to delete property')
    }
  }

  const getContactName = (contactId: string) => {
    return contacts.find((c) => c.id === contactId)?.name || 'Unknown'
  }

  const filteredProperties = properties.filter(
    (p) =>
      p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="p-8">Loading properties...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">Properties</h1>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          <Plus size={20} />
          New Property
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by address or city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-500"
        />
      </div>

      {/* Properties Table */}
      <div className="rounded-lg border border-slate-700 bg-slate-800">
        {filteredProperties.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-700 bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Province
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((property) => (
                  <tr
                    key={property.id}
                    className="border-b border-slate-700 hover:bg-slate-700/50"
                  >
                    <td className="px-6 py-4 font-semibold">
                      {property.address}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {property.city}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {property.province || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {getContactName(property.contact_id)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => deleteProperty(property.id)}
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
            No properties found. Create your first property!
          </div>
        )}
      </div>

      {/* New Property Form Modal */}
      {showNewForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowNewForm(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-slate-600 bg-slate-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-2xl font-bold">Create New Property</h2>

            <form onSubmit={createProperty} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Customer *
                </label>
                <select
                  value={formData.contactId}
                  onChange={(e) =>
                    setFormData({ ...formData, contactId: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                  required
                >
                  <option value="">Select a customer</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
                {contacts.length === 0 && (
                  <p className="mt-1 text-xs text-red-400">
                    No customers found. Create one first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  placeholder="123 Main St"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  City *
                </label>
                <input
                  type="text"
                  placeholder="Calgary"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Province (2-letter code)
                </label>
                <input
                  type="text"
                  placeholder="AB"
                  maxLength={2}
                  value={formData.province}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      province: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  placeholder="T2P 1J9"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500"
                />
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
                Create Property
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}