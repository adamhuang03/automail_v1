'use client'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlusCircle, Mail, Settings, Send, Paperclip, UserPlus, X, Trash2, Eye } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const firmEmails: { [key: string]: string } = {
  "TD Securities": "tdsecurities.com",
  "RBC Capital Markets": "rbccm.com",
  "CIBC Capital Markets": "cibccapitalmarkets.com",
  "Scotiabank Global Banking & Markets": "scotiabank.com",
  "BMO Capital Markets": "bmocapitalmarkets.com",
  "National Bank Financial Markets": "nbf.ca",
  "Goldman Sachs": "gs.com",
  "Evercore": "evercore.com",
  "Lazard": "lazard.com",
  "Morgan Stanley": "morganstanley.com",
  "Bank of America": "bofa.com"
}

const firms = [
    "TD Securities",
    "RBC Capital Markets",
    "CIBC Capital Markets",
    "Scotiabank Global Banking & Markets",
    "BMO Capital Markets",
    "National Bank Financial Markets",
    "Goldman Sachs",
    "Evercore",
    "Lazard",
    "Morgan Stanley",
    "Bank of America"
]

type Prospect = {
  name: string
  email: string
  scheduledTime: string
}

type FirmGroup = {
  firm: string
  prospects: Prospect[]
}

export default function ColdOutreachUI() {
  const [activeTab, setActiveTab] = useState('compose')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailTemplate, setEmailTemplate] = useState('')
  const [firmGroups, setFirmGroups] = useState<FirmGroup[]>([])

  const saveTemplate = () => {
    console.log("Template saved:", { subject: emailSubject, body: emailTemplate })
  }

  const addFirm = () => {
    setFirmGroups([...firmGroups, { firm: '', prospects: [{ name: '', email: '', scheduledTime: '' }] }])
  }

  const removeFirm = (firmIndex: number) => {
    const updatedFirmGroups = firmGroups.filter((_, index) => index !== firmIndex)
    setFirmGroups(updatedFirmGroups)
  }

  const addProspect = (firmIndex: number) => {
    const updatedFirmGroups = [...firmGroups]
    updatedFirmGroups[firmIndex].prospects.push({ name: '', email: '', scheduledTime: '' })
    setFirmGroups(updatedFirmGroups)
  }

  const removeProspect = (firmIndex: number, prospectIndex: number) => {
    const updatedFirmGroups = [...firmGroups]
    updatedFirmGroups[firmIndex].prospects = updatedFirmGroups[firmIndex].prospects.filter((_, index) => index !== prospectIndex)
    if (updatedFirmGroups[firmIndex].prospects.length === 0) {
      updatedFirmGroups.splice(firmIndex, 1)
    }
    setFirmGroups(updatedFirmGroups)
  }

  const updateFirm = (firmIndex: number, newFirm: string) => {
    const updatedFirmGroups = [...firmGroups]
    updatedFirmGroups[firmIndex].firm = newFirm
    updatedFirmGroups[firmIndex].prospects.forEach(prospect => {
      if (prospect.name) {
        const [firstName, lastName] = prospect.name.split(' ')
        prospect.email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${firmEmails[newFirm]}`
      }
    })
    setFirmGroups(updatedFirmGroups)
  }

  const updateProspect = (firmIndex: number, prospectIndex: number, field: keyof Prospect, value: string) => {
    const updatedFirmGroups = [...firmGroups]
    const currentFirmGroup = updatedFirmGroups[firmIndex]
    const currentProspect = currentFirmGroup.prospects[prospectIndex]

    currentProspect[field] = value

    if (field === 'name' && currentFirmGroup.firm) {
      const [firstName, lastName] = value.split(' ')
      if (firstName && lastName) {
        currentProspect.email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${firmEmails[currentFirmGroup.firm]}`
      } else {
        currentProspect.email = ''
      }
    }

    setFirmGroups(updatedFirmGroups)
  }

  const createDrafts = () => {
    console.log("Creating drafts for:", firmGroups)
  }

  const generateDraft = (prospect: Prospect, firm: string) => {
    let subject = emailSubject.replace('[NAME]', prospect.name).replace('[FIRM_NAME]', firm)
    let body = emailTemplate.replace('[NAME]', prospect.name).replace('[FIRM_NAME]', firm)
    return { subject, body }
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 border-r border-gray-200 p-4">
        <div className="flex items-center mb-8">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src="/placeholder.svg" alt="User" />
            <AvatarFallback>US</AvatarFallback>
          </Avatar>
          <span className="font-semibold">University Student</span>
        </div>
        <nav>
          <Button
            variant={activeTab === 'compose' ? 'secondary' : 'ghost'}
            className="w-full justify-start mb-2"
            onClick={() => setActiveTab('compose')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Compose
          </Button>
          <Button
            variant={activeTab === 'outreach' ? 'secondary' : 'ghost'}
            className="w-full justify-start mb-2"
            onClick={() => setActiveTab('outreach')}
          >
            <Mail className="mr-2 h-4 w-4" />
            Outreach
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
            className="w-full justify-start mb-2"
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold">Coffee Chat Outreach</h1>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'compose' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-lg font-semibold mb-4">Compose Email Template</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <Input 
                    id="subject" 
                    placeholder="Enter email subject" 
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Template
                  </label>
                  <Textarea
                    id="template"
                    placeholder="Write your email template here... Use [NAME] and [FIRM_NAME] as placeholders."
                    className="min-h-[200px]"
                    value={emailTemplate}
                    onChange={(e) => setEmailTemplate(e.target.value)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={saveTemplate}>Save Template</Button>
                    <Button variant="outline">
                      <Paperclip className="mr-2 h-4 w-4" />
                      Attach Resume
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'outreach' && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-lg font-semibold mb-4">Outreach Campaign</h2>
              <div className="space-y-8">
                {firmGroups.map((firmGroup, firmIndex) => (
                  <div key={firmIndex} className="border p-4 rounded-lg">
                    <div className="mb-4">
                      <Select
                        value={firmGroup.firm}
                        onValueChange={(value) => updateFirm(firmIndex, value)}
                        disabled={firmGroup.prospects.some(p => p.name !== '')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select firm" />
                        </SelectTrigger>
                        <SelectContent>
                          {firms.map((firm) => (
                            <SelectItem key={firm} value={firm}>
                              {firm}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Scheduled Time</TableHead>
                          <TableHead className="w-[80px]">View Draft</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {firmGroup.prospects.map((prospect, prospectIndex) => (
                          <TableRow key={prospectIndex}>
                            <TableCell>
                              <Input
                                placeholder="First name Last name"
                                value={prospect.name}
                                onChange={(e) => updateProspect(firmIndex, prospectIndex, 'name', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input value={prospect.email} readOnly />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="datetime-local"
                                value={prospect.scheduledTime}
                                onChange={(e) => updateProspect(firmIndex, prospectIndex, 'scheduledTime', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="icon">
                                      <Eye className="h-4 w-4" />
                                      <span className="sr-only">View Draft</span>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                      <DialogTitle>Email Draft</DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-2">
                                      <h3 className="text-sm font-semibold mb-1">Subject:</h3>
                                      <p className="text-sm text-gray-700 mb-4">{generateDraft(prospect, firmGroup.firm).subject}</p>
                                      <h3 className="text-sm font-semibold mb-1">Body:</h3>
                                      <p className="text-sm text-gray-500 whitespace-pre-wrap">
                                        {generateDraft(prospect, firmGroup.firm).body}
                                      </p>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeProspect(firmIndex, prospectIndex)}
                                >
                                  <X className="h-4 w-4" />
                                  <span className="sr-only">Remove Prospect</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-between items-center mt-4">
                      <Button onClick={() => addProspect(firmIndex)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Person
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFirm(firmIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove Firm</span>
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <Button onClick={addFirm}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Firm
                  </Button>
                  <Button onClick={createDrafts}>
                    <Mail className="mr-2 h-4 w-4" />
                    Create Drafts
                  </Button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'settings' && <div>Settings page goes here</div>}
        </main>
      </div>
    </div>
  )
}