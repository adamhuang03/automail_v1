"use client"
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Sidebar from '@/app/home/user/Sidebar'
import ComposeEmail from '@/app/home/user/ComposeEmail'
import OutreachCampaign from '@/app/home/user/OutreachCampaign'
import Settings from '@/app/home/user/Settings'

interface Prospect {
  name: string;
  email: string;
  firmName: string;
  scheduledDate: string;
  scheduledTime: string;
}

const dummyData: Prospect[] = [
  { name: "John Doe", email: "john.doe@goldmansachs.com", firmName: "Goldman Sachs", scheduledDate: "2023-06-15", scheduledTime: "09:00" },
  { name: "Jane Smith", email: "jane.smith@jpmorgan.com", firmName: "JP Morgan", scheduledDate: "2023-06-16", scheduledTime: "10:30" },
  { name: "Mike Johnson", email: "mike.johnson@morganstanley.com", firmName: "Morgan Stanley", scheduledDate: "2023-06-17", scheduledTime: "14:00" },
  { name: "Emily Brown", email: "emily.brown@blackrock.com", firmName: "BlackRock", scheduledDate: "2023-06-18", scheduledTime: "11:15" },
  { name: "Chris Lee", email: "chris.lee@citigroup.com", firmName: "Citigroup", scheduledDate: "2023-06-19", scheduledTime: "13:45" },
]

export default function ColdOutreachUI() {
  const [activeTab, setActiveTab] = useState<'compose' | 'outreach' | 'settings'>('compose')
  const [emailSubject, setEmailSubject] = useState<string>('')
  const [emailTemplate, setEmailTemplate] = useState<string>('')
  const [prospects, setProspects] = useState<Prospect[]>(dummyData)
  const [emailList, setEmailList] = useState<string>('')

  const saveTemplate = () => {
    console.log("Template saved:", { subject: emailSubject, body: emailTemplate })
  }

  const parseEmails = (emails: string): Prospect[] => {
    return emails.split(',').map(email => {
      const [name, domain] = email.trim().split('@')
      const [firstName, lastName] = name.split('.')
      const firmName = domain.split('.')[0]
      return {
        name: `${firstName.charAt(0).toUpperCase() + firstName.slice(1)} ${lastName.charAt(0).toUpperCase() + lastName.slice(1)}`,
        email: email.trim(),
        firmName: firmName.charAt(0).toUpperCase() + firmName.slice(1),
        scheduledDate: '',
        scheduledTime: ''
      }
    })
  }

  const handleEmailListChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEmailList(e.target.value)
    setProspects([...dummyData, ...parseEmails(e.target.value)])
  }

  const createDrafts = () => {
    console.log("Creating drafts for:", prospects)
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold">Coffee Chat Outreach</h1>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'compose' && <ComposeEmail emailSubject={emailSubject} setEmailSubject={setEmailSubject} emailTemplate={emailTemplate} setEmailTemplate={setEmailTemplate} saveTemplate={saveTemplate} />}
          {activeTab === 'outreach' && <OutreachCampaign prospects={prospects} handleEmailListChange={handleEmailListChange} createDrafts={createDrafts} />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  )
}
