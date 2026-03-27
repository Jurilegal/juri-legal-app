'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Tab {
  id: string
  label: string
  icon?: string
  component: React.ReactNode
}

export function TabPage({ tabs, basePath, defaultTab }: { tabs: Tab[]; basePath: string; defaultTab?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam || defaultTab || tabs[0]?.id || '')

  useEffect(() => {
    if (tabParam && tabs.find(t => t.id === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam, tabs])

  function switchTab(tabId: string) {
    setActiveTab(tabId)
    router.replace(`${basePath}?tab=${tabId}`, { scroll: false })
  }

  const current = tabs.find(t => t.id === activeTab) || tabs[0]

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-navy-100 mb-6 overflow-x-auto scrollbar-thin pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap cursor-pointer transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-gold-500 text-navy-900'
                : 'border-transparent text-navy-400 hover:text-navy-600 hover:border-navy-200'
            }`}
          >
            {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>{current?.component}</div>
    </div>
  )
}

export function AccordionPage({ tabs, basePath }: { tabs: Tab[]; basePath: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [openTab, setOpenTab] = useState(tabParam || tabs[0]?.id || '')

  useEffect(() => {
    if (tabParam && tabs.find(t => t.id === tabParam)) {
      setOpenTab(tabParam)
    }
  }, [tabParam, tabs])

  function toggleTab(tabId: string) {
    const next = openTab === tabId ? '' : tabId
    setOpenTab(next)
    if (next) router.replace(`${basePath}?tab=${next}`, { scroll: false })
  }

  return (
    <div className="space-y-2">
      {tabs.map(tab => (
        <div key={tab.id} className="border border-navy-100 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleTab(tab.id)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium cursor-pointer transition ${
              openTab === tab.id ? 'bg-navy-800 text-white' : 'bg-white text-navy-700 hover:bg-navy-50'
            }`}
          >
            <span>{tab.icon && <span className="mr-1.5">{tab.icon}</span>}{tab.label}</span>
            <svg className={`w-4 h-4 transition-transform ${openTab === tab.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {openTab === tab.id && (
            <div className="p-4 bg-white">{tab.component}</div>
          )}
        </div>
      ))}
    </div>
  )
}
