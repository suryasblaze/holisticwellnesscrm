'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { FiUser, FiShoppingCart, FiMessageCircle, FiClock, FiFilter, FiPlus, FiDownload, FiBell } from 'react-icons/fi'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface Lead {
  id: string
  created_at: string
  name: string
  phone: string
  email: string
  service_type: string
  message: string
  source_site: string
  status: 'New' | 'Assigned' | 'Follow-up' | 'Closed'
  assigned_to: string | null
  follow_up_date: string | null
  notes: string | null
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  expected_value: number | null
  next_action: string | null
  next_action_date: string | null
  tags: string[]
  last_contacted_at: string | null
}

interface Activity {
  id: string
  lead_id: string
  created_at: string
  created_by: string
  activity_type: 'call' | 'email' | 'meeting' | 'whatsapp' | 'note' | 'task'
  description: string
  duration: number | null
  outcome: string | null
  scheduled_at: string | null
  completed_at: string | null
}

interface Task {
  id: string
  lead_id: string
  assigned_to: string
  created_at: string
  created_by: string
  due_date: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  title: string
  description: string
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled'
  completed_at: string | null
}

interface DashboardStats {
  totalLeads: number
  conversions: number
  whatsappMessages: number
  pendingTasks: number
  leadTrends: {
    newLeads: number[]
    converted: number[]
    labels: string[]
  }
  leadSources: {
    whatsapp: number
    website: number
    referrals: number
    other: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    conversions: 0,
    whatsappMessages: 0,
    pendingTasks: 0,
    leadTrends: {
      newLeads: [],
      converted: [],
      labels: []
    },
    leadSources: {
      whatsapp: 0,
      website: 0,
      referrals: 0,
      other: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [recentLeads, setRecentLeads] = useState([])
  const [upcomingTasks, setUpcomingTasks] = useState([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'tasks' | 'appointments'>('overview')
  const [filters, setFilters] = useState({
    site: '',
    status: '',
    priority: '',
    dateRange: '7',
    search: '',
    assignedTo: '',
  })

  useEffect(() => {
    fetchDashboardData()
    fetchLeads()
    if (selectedLead) {
      fetchActivities(selectedLead.id)
      fetchTasks(selectedLead.id)
    }
  }, [filters, selectedLead])

  const fetchDashboardData = async () => {
    try {
      // Fetch total leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
      
      // Fetch conversions (leads with status 'Closed')
      const { data: conversionsData } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'Closed')

      // Fetch WhatsApp messages count
      const { data: whatsappData } = await supabase
        .from('activities')
        .select('*')
        .eq('activity_type', 'whatsapp')

      // Fetch pending tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'Pending')

      // Fetch lead trends (last 6 months)
      const months = Array.from({length: 6}, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        return format(d, 'MMM')
      }).reverse()

      // Update stats
      setStats({
        totalLeads: leadsData?.length || 0,
        conversions: conversionsData?.length || 0,
        whatsappMessages: whatsappData?.length || 0,
        pendingTasks: tasksData?.length || 0,
        leadTrends: {
          newLeads: [30, 42, 35, 54, 62, 58], // Replace with actual data
          converted: [10, 15, 12, 25, 22, 28], // Replace with actual data
          labels: months
        },
        leadSources: {
          whatsapp: Math.floor(Math.random() * 100),
          website: Math.floor(Math.random() * 100),
          referrals: Math.floor(Math.random() * 100),
          other: Math.floor(Math.random() * 50)
        }
      })

      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  const fetchLeads = async () => {
    try {
      let query = supabase
        .from('leads')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })

      if (filters.site) query = query.eq('source_site', filters.site)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.priority) query = query.eq('priority', filters.priority)
      if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo)

      if (filters.dateRange) {
        const date = new Date()
        date.setDate(date.getDate() - parseInt(filters.dateRange))
        query = query.gte('created_at', date.toISOString())
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
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

  const fetchActivities = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*, profiles(full_name)')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const fetchTasks = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, profiles(full_name)')
        .eq('lead_id', leadId)
        .order('due_date', { ascending: true })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const addActivity = async (activity: Partial<Activity>) => {
    try {
      const { error } = await supabase
        .from('activities')
        .insert([{
          ...activity,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])

      if (error) throw error
      if (selectedLead) fetchActivities(selectedLead.id)
    } catch (error) {
      console.error('Error adding activity:', error)
    }
  }

  const addTask = async (task: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          ...task,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])

      if (error) throw error
      if (selectedLead) fetchTasks(selectedLead.id)
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Add activity for status change
      if (updates.status) {
        await addActivity({
          lead_id: id,
          activity_type: 'note',
          description: `Status changed to ${updates.status}`,
        })
      }

      // Send WhatsApp notification for follow-up
      if (updates.status === 'Follow-up') {
        const lead = leads.find(l => l.id === id)
        if (lead) {
          await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: lead.phone,
              template: 'follow_up_message',
              components: [{
                type: 'body',
                parameters: [{ type: 'text', text: lead.name }]
              }]
            })
          })
        }
      }

      fetchLeads()
      if (selectedLead?.id === id) {
        const { data } = await supabase
          .from('leads')
          .select('*')
          .eq('id', id)
          .single()
        setSelectedLead(data)
      }
    } catch (error) {
      console.error('Error updating lead:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back! Here&apos;s what&apos;s happening with your leads today.</p>
            </div>
            <div className="flex space-x-4">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Today
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                + New Lead
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Leads</p>
                <h3 className="text-2xl font-semibold">{stats.totalLeads}</h3>
                <p className="text-sm text-green-600">+12.5% vs last month</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FiUser className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Conversions</p>
                <h3 className="text-2xl font-semibold">{stats.conversions}</h3>
                <p className="text-sm text-green-600">+8.2% vs last month</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FiShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">WhatsApp Messages</p>
                <h3 className="text-2xl font-semibold">{stats.whatsappMessages}</h3>
                <p className="text-sm text-green-600">+24.3% vs last month</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FiMessageCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Tasks</p>
                <h3 className="text-2xl font-semibold">{stats.pendingTasks}</h3>
                <p className="text-sm text-red-600">-5.4% vs last month</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <FiClock className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Trends Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Lead Trends</h3>
              <div className="flex items-center space-x-2">
                <button className="flex items-center px-3 py-1 text-sm border rounded-md">
                  <FiFilter className="mr-2" /> Filter
                </button>
                <button className="text-green-600 hover:text-green-700">View Report →</button>
              </div>
            </div>
            <Line
              data={{
                labels: stats.leadTrends.labels,
                datasets: [
                  {
                    label: 'New Leads',
                    data: stats.leadTrends.newLeads,
                    borderColor: '#10B981',
                    tension: 0.4
                  },
                  {
                    label: 'Converted',
                    data: stats.leadTrends.converted,
                    borderColor: '#8B5CF6',
                    tension: 0.4
                  }
                ]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>

          {/* Lead Sources */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Lead Sources</h3>
              <button>
                <FiFilter />
              </button>
            </div>
            <div className="relative">
              {/* Add a Pie chart here */}
              <div className="flex flex-col items-center justify-center">
                <div className="text-3xl font-semibold text-center mb-2">
                  {stats.totalLeads}
                </div>
                <div className="text-sm text-gray-500">Total Leads</div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm">WhatsApp ({stats.leadSources.whatsapp})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  <span className="text-sm">Website ({stats.leadSources.website})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-sm">Referrals ({stats.leadSources.referrals})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                  <span className="text-sm">Other ({stats.leadSources.other})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Leads and Upcoming Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Recent Leads</h3>
              <button className="text-green-600 hover:text-green-700">View All →</button>
            </div>
            {recentLeads.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No recent leads</div>
            ) : (
              <div className="space-y-4">
                {/* Add recent leads list here */}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Upcoming Tasks</h3>
              <button className="text-green-600 hover:text-green-700">View All →</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="bg-green-100 p-2 rounded-full mr-4">
                  <FiMessageCircle className="text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">Call John Smith</h4>
                  <p className="text-xs text-gray-500">Jun 15, 10:00 AM</p>
                </div>
                <div className="bg-green-100 px-2 py-1 rounded text-xs text-green-600">
                  Open
                </div>
              </div>
              {/* Add more tasks here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 