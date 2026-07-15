'use client'

import { useEffect, useState } from 'react'

interface JobData {
  id: string
  title: string
  serviceType: string
  value: number
  stage: string
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    openJobs: 0,
    jobValue: 0,
    newContacts: 0,
    wonThisMonth: 0,
  })
  const [recentJobs, setRecentJobs] = useState<JobData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch jobs
        const jobsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/jobs`
        )

        // Fetch contacts
        const contactsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/contacts`
        )

        if (jobsResponse.ok && contactsResponse.ok) {
          const jobsData = await jobsResponse.json()
          const contactsData = await contactsResponse.json()
          
          const jobs = jobsData.jobs || []
          const contacts = contactsData.contacts || []

          // Calculate stats
          const openJobs = jobs.filter(
            (j: JobData) => j.stage !== 'complete' && j.stage !== 'invoiced'
          )
          const totalValue = openJobs.reduce(
            (sum: number, j: JobData) => sum + (j.value || 0),
            0
          )
          const completedThisMonth = jobs.filter(
            (j: JobData) => j.stage === 'complete'
          ).length

          setStats({
            openJobs: openJobs.length,
            jobValue: totalValue,
            newContacts: contacts.length,
            wonThisMonth: completedThisMonth,
          })
          setRecentJobs(openJobs.slice(0, 5))
        }
      } catch (error) {
        console.log('Dashboard: API not ready yet', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>
  }

  return (
    <div className="p-8">
      <h1 className="mb-8 text-4xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="text-sm text-slate-400">Open Jobs</div>
          <div className="mt-2 text-3xl font-bold">{stats.openJobs}</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="text-sm text-slate-400">Pipeline Value</div>
          <div className="mt-2 text-3xl font-bold">
            ${stats.jobValue.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="text-sm text-slate-400">Won This Month</div>
          <div className="mt-2 text-3xl font-bold">{stats.wonThisMonth}</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="text-sm text-slate-400">Total Customers</div>
          <div className="mt-2 text-3xl font-bold">{stats.newContacts}</div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="mb-4 text-xl font-bold">Recent Open Jobs</h2>
        {recentJobs.length > 0 ? (
          <div className="space-y-4">
            {recentJobs.map((job) => (
              <div key={job.id} className="border-b border-slate-700 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{job.title}</div>
                    <div className="text-sm text-slate-400">
                      Service: {job.serviceType}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${job.value}</div>
                    <div className="text-sm text-slate-400">{job.stage}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">
            No open jobs. Go to{' '}
            <a href="/jobs" className="text-purple-400 hover:text-purple-300">
              Jobs
            </a>{' '}
            to create one!
          </p>
        )}
      </div>
    </div>
  )
}