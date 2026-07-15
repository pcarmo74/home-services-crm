'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface Crew {
  id: string
  name: string
  leadPerson: string
  skills: string[]
  serviceAreas: string[]
  capacity: number
  phone: string
  email?: string
  avgRating: number
  jobsCompletedThisMonth: number
  createdAt: string
}

const SKILL_OPTIONS = ['HVAC', 'Plumbing', 'Electrical', 'General']

export default function CrewsPage() {
  const [crews, setCrews] = useState<Crew[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    leadPerson: '',
    phone: '',
    email: '',
    capacity: '5',
    skills: [] as string[],
  })

  // Fetch crews
  useEffect(() => {
    const fetchCrews = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/crews`
        )
        if (res.ok) {
          const data = await res.json()
          setCrews(data.crews || [])
        }
      } catch (error) {
        console.error('Failed to fetch crews:', error)
        toast.error('Failed to load crews')
      } finally {
        setLoading(false)
      }
    }

    fetchCrews()
  }, [])

  // Create new crew
  const createCrew = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.leadPerson || !formData.phone) {
      toast.error('Please fill in required fields')
      return
    }

    if (formData.skills.length === 0) {
      toast.error('Select at least one skill')
      return
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/crews`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            leadPerson: formData.leadPerson,
            phone: formData.phone,
            email: formData.email || null,
            capacity: parseInt(formData.capacity),
            skills: formData.skills,
            serviceAreas: [],
          }),
        }
      )

      if (res.ok) {
        const newCrew = await res.json()
        setCrews([newCrew, ...crews])
        setFormData({
          name: '',
          leadPerson: '',
          phone: '',
          email: '',
          capacity: '5',
          skills: [],
        })
        setShowNewForm(false)
        toast.success('Crew created!')
      }
    } catch (error) {
      console.error('Failed to create crew:', error)
      toast.error('Failed to create crew')
    }
  }

  // Toggle skill
  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }))
  }

  // Delete crew
  const deleteCrew = async (id: string) => {
    if (!confirm('Are you sure?')) return

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/crews/${id}`,
        { method: 'DELETE' }
      )

      if (res.ok) {
        setCrews(crews.filter((c) => c.id !== id))
        toast.success('Crew deleted')
      }
    } catch (error) {
      console.error('Failed to delete crew:', error)
      toast.error('Failed to delete crew')
    }
  }

  if (loading) {
    return <div className="p-8">Loading crews...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">Crews</h1>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          <Plus size={20} />
          New Crew
        </button>
      </div>

      {/* Crews Grid */}
      <div className="grid grid-cols-3 gap-6">
        {crews.length > 0 ? (
          crews.map((crew) => (
            <div
              key={crew.id}
              className="rounded-lg border border-slate-700 bg-slate-800 p-6"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{crew.name}</h3>
                  <p className="text-sm text-slate-400">{crew.leadPerson}</p>
                </div>
                <button
                  onClick={() => deleteCrew(crew.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-400">Phone</p>
                  <p className="font-semibold">{crew.phone}</p>
                </div>

                <div>
                  <p className="text-slate-400">Capacity</p>
                  <p className="font-semibold">
                    {crew.capacity} jobs/day
                  </p>
                </div>

                <div>
                  <p className="text-slate-400">Skills</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {crew.skills?.map((skill) => (
                      <span
                        key={skill}
                        className="inline-block rounded bg-purple-900 px-2 py-1 text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-slate-400">Rating</p>
                  <p className="font-semibold">
                    ⭐ {crew.avgRating?.toFixed(1) || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400">Jobs This Month</p>
                  <p className="font-semibold">
                    {crew.jobsCompletedThisMonth || 0}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-400">
            No crews yet. Create your first crew!
          </div>
        )}
      </div>

      {/* New Crew Form Modal */}
      {showNewForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowNewForm(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-slate-600 bg-slate-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-2xl font-bold">Create New Crew</h2>

            <form onSubmit={createCrew} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Crew Name *
                </label>
                <input
                  type="text"
                  placeholder="Mike's HVAC Team"
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
                  Lead Person *
                </label>
                <input
                  type="text"
                  placeholder="Mike Johnson"
                  value={formData.leadPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, leadPerson: e.target.value })
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
                  placeholder="555-5678"
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
                  Email
                </label>
                <input
                  type="email"
                  placeholder="mike@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Daily Capacity (jobs/day) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Skills *
                </label>
                <div className="space-y-2">
                  {SKILL_OPTIONS.map((skill) => (
                    <label key={skill} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.skills.includes(skill)}
                        onChange={() => toggleSkill(skill)}
                        className="rounded"
                      />
                      <span>{skill}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 mt-4"
              >
                Create Crew
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}