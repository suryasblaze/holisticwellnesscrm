'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { FiFilter, FiPlus, FiPhone, FiMail, FiMessageSquare, FiCalendar, FiGlobe } from 'react-icons/fi'

interface Lead {
  id: string
  created_at: string
  name: string
  phone: string
  email: string | null
  service_type: string
  source_site: string
  status: string
  assigned_to: string | null
  message?: string
  profiles?: { full_name: string } | null
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    dateRange: '7',
    search: '',
    assignedTo: '',
    source_site: ''
  })
  const [uniqueSourceSites, setUniqueSourceSites] = useState<string[]>([])

  useEffect(() => {
    fetchLeads()
    fetchUniqueSourceSites()
  }, [filters])

  const fetchUniqueSourceSites = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('source_site', { count: 'exact', head: false })

      if (error) throw error
      
      if (data) {
        const distinctSources = Array.from(new Set(data.map((item: any) => item.source_site).filter(Boolean)))
        setUniqueSourceSites(distinctSources)
      }
    } catch (error) {
      console.error('Error fetching unique source sites:', error)
    }
  }

  const fetchLeads = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('leads')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })

      if (filters.status) query = query.eq('status', filters.status)
      if (filters.priority) query = query.eq('priority', filters.priority)
      if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo)
      if (filters.source_site) query = query.eq('source_site', filters.source_site)

      if (filters.dateRange) {
        const date = new Date()
        date.setDate(date.getDate() - parseInt(filters.dateRange))
        query = query.gte('created_at', date.toISOString())
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%,message.ilike.%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-yellow-100 text-yellow-800'
      case 'Assigned': return 'bg-blue-100 text-blue-800'
      case 'Follow-up': return 'bg-purple-100 text-purple-800'
      case 'Closed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'bg-gray-100 text-gray-800'
      case 'Medium': return 'bg-blue-100 text-blue-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500">Manage and track your leads</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
          <FiPlus className="mr-2 h-5 w-5" />
          Add New Lead
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Status</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="lost">Lost</option>
                  <option value="won">Won</option>
                </select>
                <FiFilter className="absolute right-3 top-3 text-gray-400" />
              </div>

              <div className="relative">
                <select
                  value={filters.source_site}
                  onChange={(e) => setFilters({ ...filters, source_site: e.target.value })}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Sources</option>
                  {uniqueSourceSites.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                  {uniqueSourceSites.indexOf('WhatsApp') === -1 && <option value="WhatsApp">WhatsApp</option>}
                  {uniqueSourceSites.indexOf('Website') === -1 && <option value="Website">Website</option>}
                </select>
                <FiGlobe className="absolute right-3 top-3 text-gray-400" />
              </div>

              <div className="relative">
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
                <FiFilter className="absolute right-3 top-3 text-gray-400" />
              </div>

              <div className="relative">
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="">All time</option>
                </select>
                <FiFilter className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search leads..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {lead.name?.charAt(0)?.toUpperCase() || 'N'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{lead.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{lead.phone}</div>
                        {lead.email && <div className="text-sm text-gray-500">{lead.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {lead.source_site}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.service_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.created_at ? format(new Date(lead.created_at), 'PPpp') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" className="text-primary-600 hover:text-primary-900 mr-3">View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 