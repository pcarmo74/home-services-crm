'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, Plus, AlertCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Job {
  id: string
  title: string
  serviceType: string
  value: number
  stage: string
  contactId: string
  crewId?: string
  priority: string
}

interface Crew {
  id: string
  name: string
  skills: string[]
}

interface Contact {
  id: string
  name: string
  email: string
  phone: string
}

interface Property {
  id: string
  address: string
  city: string
  contactId: string
}

const STAGES = ['new', 'scheduled', 'in_progress', 'complete', 'invoiced']
const SERVICE_TYPES = ['HVAC', 'Plumbing', 'Electrical', 'General']
const PRIORITIES = ['routine', 'urgent', 'emergency']

export default function JobsPage() {
  const [jobs, setJobs] = useState<Record<string, Job[]>>({
    new: [],
    scheduled: [],
    in_progress: [],
    complete: [],
    invoiced: [],
  })
  const [crews, setCrews] = useState<Crew[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showNewJobForm, setShowNewJobForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    serviceType: 'HVAC',
    value: '',
    priority: 'routine',
    contactId: '',
    propertyId: '',
  })

  // Fetch jobs, crews, contacts, and properties on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, crewsRes, contactsRes, propertiesRes] = await Promise.all(
          [
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crews`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contacts`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties`),
          ]
        )

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json()
          const jobsByStage: Record<string, Job[]> = {
            new: [],
            scheduled: [],
            in_progress: [],
            complete: [],
            invoiced: [],
          }

          jobsData.jobs?.forEach((job: Job) => {
            const stage = job.stage || 'new'
            if (jobsByStage[stage]) {
              jobsByStage[stage].push(job)
            }
          })

          setJobs(jobsByStage)
        }

        if (crewsRes.ok) {
          const crewsData = await crewsRes.json()
          setCrews(crewsData.crews || [])
        }

        if (contactsRes.ok) {
          const contactsData = await contactsRes.json()
          setContacts(contactsData.contacts || [])
        }

        if (propertiesRes.ok) {
          const propertiesData = await propertiesRes.json()
          setProperties(propertiesData.properties || [])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Create new job
  const createJob = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.contactId || !formData.propertyId) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/jobs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            serviceType: formData.serviceType,
            value: parseFloat(formData.value) || 0,
            priority: formData.priority,
            contactId: formData.contactId,
            propertyId: formData.propertyId,
          }),
        }
      )

      if (res.ok) {
        const newJob = await res.json()

        setJobs((prev) => ({
          ...prev,
          new: [newJob, ...(prev.new || [])],
        }))

        setFormData({
          title: '',
          serviceType: 'HVAC',
          value: '',
          priority: 'routine',
          contactId: '',
          propertyId: '',
        })

        setShowNewJobForm(false)
        toast.success('Job created!')
      } else {
        toast.error('Failed to create job')
      }
    } catch (error) {
      console.error('Failed to create job:', error)
      toast.error('Failed to create job')
    }
  }

  // Assign crew to job
  const assignCrew = async (jobId: string, crewId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crewId, stage: 'scheduled' }),
        }
      )

      if (res.ok) {
        const updatedJob = await res.json()

        setJobs((prev) => {
          const newJobs = { ...prev }
          const oldStage = Object.entries(newJobs).find((entry) =>
            entry[1].some((j) => j.id === jobId)
          )?.[0]

          if (oldStage) {
            newJobs[oldStage] = newJobs[oldStage].filter(
              (j) => j.id !== jobId
            )
          }

          newJobs['scheduled'] = [
            ...(newJobs['scheduled'] || []),
            updatedJob,
          ]
          return newJobs
        })

        toast.success('Crew assigned!')
      }
    } catch (error) {
      console.error('Failed to assign crew:', error)
      toast.error('Failed to assign crew')
    }
  }

  // Move job to next stage
  const moveJobToNextStage = async (job: Job) => {
    const currentStageIndex = STAGES.indexOf(job.stage)
    if (currentStageIndex === -1 || currentStageIndex === STAGES.length - 1) {
      return
    }

    const nextStage = STAGES[currentStageIndex + 1]

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${job.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: nextStage }),
        }
      )

      if (res.ok) {
        const updatedJob = await res.json()

        setJobs((prev) => {
          const newJobs = { ...prev }
          newJobs[job.stage] = newJobs[job.stage].filter(
            (j) => j.id !== job.id
          )
          newJobs[nextStage] = [...(newJobs[nextStage] || []), updatedJob]
          return newJobs
        })

        toast.success(`Moved to ${nextStage}`)
      }
    } catch (error) {
      console.error('Failed to move job:', error)
      toast.error('Failed to move job')
    }
  }

  if (loading) {
    return <div className="p-8">Loading jobs...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">Job Pipeline</h1>
        <button
          onClick={() => setShowNewJobForm(true)}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          <Plus size={20} />
          New Job
        </button>
      </div>

      {/* Job Pipeline - Kanban Board */}
      <div className="grid grid-cols-5 gap-4">
        {STAGES.map((stage) => (
          <div key={stage} className="rounded-lg border border-slate-700 bg-slate-800 p-4">
            <div className="mb-4 border-b border-slate-700 pb-3">
              <h2 className="font-semibold capitalize">{stage}</h2>
              <p className="text-sm text-slate-400">
                {jobs[stage]?.length || 0} jobs
              </p>
            </div>

            <div className="space-y-3">
              {jobs[stage]?.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="cursor-pointer rounded-lg border border-slate-600 bg-slate-700 p-3 hover:border-purple-500 hover:bg-slate-600"
                >
                  <div className="mb-2">
                    <p className="font-semibold text-sm">{job.title}</p>
                    <p className="text-xs text-slate-400">{job.serviceType}</p>
                  </div>

                  <div className="mb-2 flex items-center justify-between">
                    <span className="inline-block rounded bg-slate-600 px-2 py-1 text-xs">
                      ${job.value}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        job.priority === 'urgent'
                          ? 'text-red-400'
                          : job.priority === 'emergency'
                          ? 'text-red-600'
                          : 'text-yellow-400'
                      }`}
                    >
                      {job.priority}
                    </span>
                  </div>

                  {!job.crewId && stage === 'new' && crews.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        assignCrew(job.id, crews[0].id)
                      }}
                      className="w-full rounded bg-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-500"
                    >
                      Assign Crew
                    </button>
                  )}

                  {job.crewId && (
                    <p className="text-xs text-green-400">✓ Assigned</p>
                  )}

                  {stage !== 'invoiced' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        moveJobToNextStage(job)
                      }}
                      className="mt-2 w-full flex items-center justify-center gap-1 rounded bg-purple-600 px-2 py-1 text-xs hover:bg-purple-700"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              ))}

              {(!jobs[stage] || jobs[stage].length === 0) && (
                <p className="text-center text-sm text-slate-500">No jobs</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-slate-600 bg-slate-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-2xl font-bold">{selectedJob.title}</h2>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400">Service Type</p>
                <p className="font-semibold">{selectedJob.serviceType}</p>
              </div>

              <div>
                <p className="text-slate-400">Value</p>
                <p className="font-semibold">${selectedJob.value}</p>
              </div>

              <div>
                <p className="text-slate-400">Priority</p>
                <p className="font-semibold capitalize">{selectedJob.priority}</p>
              </div>

              <div>
                <p className="text-slate-400">Stage</p>
                <p className="font-semibold capitalize">{selectedJob.stage}</p>
              </div>

              {selectedJob.crewId && (
                <div>
                  <p className="text-slate-400">Assigned Crew</p>
                  <p className="font-semibold">
                    {crews.find((c) => c.id === selectedJob.crewId)?.name ||
                      'Unknown'}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedJob(null)}
              className="mt-6 w-full rounded bg-slate-700 px-4 py-2 hover:bg-slate-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* New Job Form Modal */}
      {showNewJobForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowNewJobForm(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-slate-600 bg-slate-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Create New Job</h2>
              <button
                onClick={() => setShowNewJobForm(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={createJob} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Furnace Repair"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Service Type
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) =>
                    setFormData({ ...formData, serviceType: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                >
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Job Value ($)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

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
                  Property Location *
                </label>
                <select
                  value={formData.propertyId}
                  onChange={(e) =>
                    setFormData({ ...formData, propertyId: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                  required
                >
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.address}, {property.city}
                    </option>
                  ))}
                </select>
                {properties.length === 0 && (
                  <p className="mt-1 text-xs text-red-400">
                    No properties found. Create one first.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 mt-4"
              >
                Create Job
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}