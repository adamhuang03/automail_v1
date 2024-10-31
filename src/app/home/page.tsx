'use client'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlusCircle, Mail, Settings, Send, Paperclip, UserPlus, X, Trash2, Eye, SaveIcon, LogOutIcon, InboxIcon, EyeIcon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

import { supabase } from '@/lib/db/supabase'
import { User } from '@supabase/supabase-js'
import { Composed, OutreachUser } from '@/utils/types'
import { useRouter } from 'next/navigation'
import { ManagePage } from './managePage'
import { getFileUrl } from '@/utils/getFile'
import ComposedPage from './composedPage'
import SettingsPage from './settingsPage'

type Prospect = {
  name: string
  email: string
  scheduledTime: {
    utcTime: string
    localTime: string
  }
}

type FirmGroup = {
  firm: string
  firmId: string
  userPrivate: number
  prospects: Prospect[]
}

export default function ColdOutreachUI() {
  const [activeTab, setActiveTab] = useState('compose')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailTemplate, setEmailTemplate] = useState('')
  const [resumeFilePath, setResumeFilePath] = useState<string | null>(null)
  const [resumeFileUrl, setResumeFileUrl] = useState<string | null>(null)
  const [firmGroups, setFirmGroups] = useState<FirmGroup[]>([])
  const [firms, setFirms] = useState<string[] | null>(null)
  const [firmEmails, setFirmEmails] = useState<Record<string, (string | number)[]> | null>(null)
  const [addTempMap, setAddTempMap] = useState<{ [id: number]: string }>({});

  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const [composedChanged, setComposedChanged] = useState<number>(0)
  const [popupChanged, setPopupChanged] = useState<boolean>(false)
  const [pageLoadingComplete, setPageLoadingComplete] = useState<boolean>(false);

  const utcToLocal = (datetime: string) => {
    const utcTime = new Date(datetime); // Your original UTC time
    const localTime = new Date(utcTime.getTime() - utcTime.getTimezoneOffset() * 60000);
    return localTime.toISOString().slice(0, 16)
  }

  const addFirm = () => {
    const currentDate = utcToLocal(new Date().toISOString())
    const currentDateUtc = new Date(currentDate).toISOString().slice(0, 16);
    const updatedFirmGroups = [...firmGroups, { firm: '', firmId: '', userPrivate: 0, prospects: [{ name: '', email: '', scheduledTime: {utcTime: currentDateUtc, localTime: currentDate} }] }]
    setFirmGroups(updatedFirmGroups)
    const newFirmIndex = updatedFirmGroups.length - 1;
    setAddTempMap((prev) => ({
      ...prev,
      [newFirmIndex]: "1",
    }))
  }

  const removeFirm = (firmIndex: number) => {
    const updatedFirmGroups = firmGroups.filter((_, index) => index !== firmIndex)
    setFirmGroups(updatedFirmGroups)
  }

  const addProspect = (firmIndex: number) => {
    const currentDate = utcToLocal(new Date().toISOString())
    const currentDateUtc = new Date(currentDate).toISOString().slice(0, 16);
    const updatedFirmGroups = [...firmGroups]
    updatedFirmGroups[firmIndex].prospects.push({ name: '', email: '', scheduledTime: {utcTime: currentDateUtc, localTime: currentDate} })
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

  const updateFirm = (firmIndex: number, newFirmId: string) => {
    const updatedFirmGroups = [...firmGroups]
    if (
      firmEmails &&
      typeof firmEmails[newFirmId][0] === 'string' &&
      typeof  firmEmails[newFirmId][2] === 'number'
    ) {
      updatedFirmGroups[firmIndex].firm = firmEmails[newFirmId][0]
      updatedFirmGroups[firmIndex].firmId = newFirmId
      console.log(newFirmId, firmEmails[newFirmId][0])
      
      updatedFirmGroups[firmIndex].userPrivate = firmEmails[newFirmId][2]
      updatedFirmGroups[firmIndex].prospects.forEach(prospect => {
        if (prospect.name && firmEmails) {
          const [firstName, lastName] = prospect.name.split(' ')
          prospect.email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${firmEmails[newFirmId][0]}`
        }
      })
      setFirmGroups(updatedFirmGroups)
      console.log(updatedFirmGroups)
    } else {
      console.error("Firm Emails was not loaded properly...")
    }
  }

  const updateProspect = (firmIndex: number, prospectIndex: number, field: keyof Prospect, value: string) => {
    const updatedFirmGroups = [...firmGroups]
    const currentFirmGroup = updatedFirmGroups[firmIndex]
    const currentProspect = currentFirmGroup.prospects[prospectIndex]

    if (field === 'name' && currentFirmGroup.firm) {
      currentProspect[field] = value
      const [firstName, lastName] = value.split(' ')
      if (firstName && lastName && firmEmails) {
        currentProspect.email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${firmEmails[currentFirmGroup.firmId][1]}`
      } else {
        currentProspect.email = ''
      }

    } 
    console.log('here')
    if (field === 'scheduledTime' && currentFirmGroup.firm) {
      console.log('here')
    
      const localDate = new Date(value); // Creates a Date object in local time
      const isoString = localDate.toISOString();
      const isoUntilMinute = isoString.slice(0, 16)
      currentProspect[field] = {
        utcTime: isoUntilMinute,
        localTime: value
      };
    
    }

    setFirmGroups(updatedFirmGroups)
  }

  // SAVE FOR LATER
  // const saveDrafts = async () => {
  //   // For each firm group, for each prospect
  //   // insert, status, user.id, to_name, to_email, to_firm, firm_email_id, subject_generated,email_generated
  //   Object.entries(firmGroups).map(([key, value]))
  //   console.log("Creating drafts for:", firmGroups)
  // }

  const createDrafts = async() => {
    const data: { 
      status: string,
      user_profile_id: string,
      to_name: string,
      to_email: string,
      to_firm: string,
      firm_email_id: string | null,
      firm_email_user_id: string | null,
      subject_generated: string,
      email_generated: string,
      scheduled_datetime_utc: string,
      provider_name: string
    }[] = [];
    const gmailData: { 
      to_email: string,
      subject_generated: string,
      email_generated: string,
      scheduled_datetime_utc: string
    }[] = [];
    let localErrorCount = 0;

    firmGroups.forEach(firmGroup => {
      let prospects = firmGroup.prospects
      prospects.forEach(prospect => {
        const [firstName, lastName] = prospect.name.split(' ')
        // console.log(firstName, lastName)
        if (firstName === undefined || lastName === undefined) {
          localErrorCount++
        } 
      })
    })
    if (localErrorCount > 0) {
      alert('Ensure name includes both first and last name.')
      return
    }

    firmGroups.forEach(firmGroup => {
      let prospects = firmGroup.prospects
      prospects.forEach(prospect => {
        if (firmEmails && user && firmGroup.userPrivate === 0) {
          const draft = generateDraft(prospect, firmGroup.firm)
          // data.push({
          //   status: "Scheduled",
          //   user_profile_id: user.id,
          //   to_name: prospect.name,
          //   to_email: prospect.email,
          //   to_firm: firmGroup.firm,
          //   firm_email_id: firmGroup.firmId,
          //   firm_email_user_id: null,
          //   subject_generated: draft.subject,
          //   email_generated: draft.body,
          //   scheduled_datetime_utc: prospect.scheduledTime.utcTime,
          //   provider_name: user.app_metadata.provider || ''
          // });
          console.log(
            {
              status: "Scheduled",
              user_profile_id: user.id,
              to_name: prospect.name,
              to_email: prospect.email,
              to_firm: firmGroup.firm,
              firm_email_id: firmGroup.firmId,
              firm_email_user_id: null,
              subject_generated: draft.subject,
              email_generated: draft.body,
              scheduled_datetime_utc: prospect.scheduledTime.utcTime,
              provider_name: user.app_metadata.provider || ''
            }
          )
        } else if (firmEmails && user && firmGroup.userPrivate === 1) {
          const draft = generateDraft(prospect, firmGroup.firm)
          // data.push({
          //   status: "Scheduled",
          //   user_profile_id: user.id,
          //   to_name: prospect.name,
          //   to_email: prospect.email,
          //   to_firm: firmGroup.firm,
          //   firm_email_id: null,
          //   firm_email_user_id: firmGroup.firmId,
          //   subject_generated: draft.subject,
          //   email_generated: draft.body,
          //   scheduled_datetime_utc: prospect.scheduledTime.utcTime,
          //   provider_name: user.app_metadata.provider || ''
          // });
          console.log({
            status: "Scheduled",
            user_profile_id: user.id,
            to_name: prospect.name,
            to_email: prospect.email,
            to_firm: firmGroup.firm,
            firm_email_id: null,
            firm_email_user_id: firmGroup.firmId,
            subject_generated: draft.subject,
            email_generated: draft.body,
            scheduled_datetime_utc: prospect.scheduledTime.utcTime,
            provider_name: user.app_metadata.provider || ''
          })
        }
      })
    })
    // console.log("Creating drafts for:", data)
    const { error } = await supabase.from('outreach').insert(data)
    if (error) {
      console.error(error)
    }
    setActiveTab('manage')
  }

  const generateDraft = (prospect: Prospect, firm: string) => {
    // Use regular expressions with the `g` flag to replace all instances
    let subject = emailSubject
      .replace(/\[NAME\]/g, prospect.name.split(' ')[0])
      .replace(/\[FIRM_NAME\]/g, firm);
    
    let body = emailTemplate
      .replace(/\[NAME\]/g, prospect.name.split(' ')[0])
      .replace(/\[FIRM_NAME\]/g, firm);
    
    return { subject, body };
  };

  const handleLogout = async() => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error logging out:', error.message);

    } else {
      // console.log('Logged out successfully!');

      // Redirect or update UI
      router.push('/login'); // Redirect to the login page after logout
    }
  }

  const handleActiveTab = (tab: string) => {
    console.log(composedChanged)
    if (tab !== 'composed' && composedChanged > 1) {
      setPopupChanged(true)
    } else {
      setActiveTab(tab)
      setComposedChanged(-1)
    }
  }

  //Loading useEffect
  useEffect(() => {
    (async() => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // console.log(session.user)
        const { data, error } = await supabase.from('user_profile')
        .select('*')
        .eq('id', session.user.id)

        if (data && data.length > 0) {
          setUser(session.user)
        } else {
          router.push('/onboard')
        }
      } else {
        router.push('/login')
      }

      // const { data, error } = await supabase.from('firm_email')
      // .select('firm_name')

      // if (data) {
      //   const firmNames = data.map<string>((item) => item.firm_name);
      //   setFirms(firmNames)
      // }
    })();

    (async() => {
      

    })();

  }, [user])

  //Page load part 2
  useEffect(() => {
    (async() => {

      if (user) {
        const { data, error }: { data: Record<number, Composed> | null, error: any } = await supabase.from('composed')
        .select('*')
        .filter('user_profile_id', 'eq', user?.id)

        if (data && Object.keys(data).length > 0) {
          setEmailSubject(data[0].subject)
          setEmailTemplate(data[0].composed_template)
          setResumeFilePath(data[0].resume_link_filepath)
          setResumeFileUrl(data[0].resume_link)
        }

        const { data: publicFirmData, error: errorPublic } = await supabase.from('firm_email')
          .select('id, firm_name, email_ending');

        if (publicFirmData) {
          // Initialize with public data
          const firmEmailsDict = publicFirmData.reduce<Record<string, [string, string, number]>>((acc, item) => {
            acc[item.id] = [item.firm_name, item.email_ending, 0];
            return acc;
          }, {});

          const { data: privateFirmData, error: errorPrivate } = await supabase.from('firm_email_user')
            .select('id, user_profile_id, firm_name, email_ending')
            .eq('user_profile_id', user?.id)

          if (privateFirmData) {
            // Merge private data into the existing dictionary
            privateFirmData.forEach(item => {
              firmEmailsDict[item.id] = [item.firm_name, item.email_ending, 1];
            });
          } else {
            console.log(errorPrivate)
          }

          // Set the combined dictionary to state
          setFirmEmails(firmEmailsDict);
        }

      }

    })();

    setPageLoadingComplete(true)
  }, [user])

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 border-r border-gray-200 p-4">
        <div className="flex items-center mb-8">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={user?.user_metadata.avatar_url} alt={`${user?.user_metadata.full_name}} User`} />
            <AvatarFallback className='bg-gray-300'>{user?.user_metadata.full_name[0]}</AvatarFallback>
          </Avatar>
          <span className="font-semibold">{user?.user_metadata.full_name}</span>
        </div>
        <nav className='flex flex-col'>
          <Button
            variant={activeTab === 'compose' ? 'outline' : 'ghost'}
            className="w-full justify-start mb-2"
            onClick={() => handleActiveTab('compose')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Compose
          </Button>
          <Button
            variant={activeTab === 'outreach' ? 'outline' : 'ghost'}
            className="w-full justify-start mb-2"
            onClick={() => handleActiveTab('outreach')}
          >
            <Mail className="mr-2 h-4 w-4" />
            Outreach
          </Button>
          <Button
            variant={activeTab === 'manage' ? 'outline' : 'ghost'}
            className="w-full justify-start mb-2"
            onClick={() => handleActiveTab('manage')}
          >
            <InboxIcon className="mr-2 h-4 w-4" />
            Manage
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'outline' : 'ghost'}
            className="w-full justify-start mb-2"
            onClick={() => handleActiveTab('settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button
            variant={activeTab === 'logout' ? 'outline' : 'ghost'}
            className="w-full justify-start mb-2"
            onClick={handleLogout}
          >
            <LogOutIcon className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold">Automail-v1</h1>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'compose' && (
            <ComposedPage 
              user={user}
              pageLoadingComplete={pageLoadingComplete}
              setActiveTab={setActiveTab}
              setComposedChanged={setComposedChanged}
              resumeFilePath={resumeFilePath}
              setResumeFilePath={setResumeFilePath}
              resumeFileUrl={resumeFileUrl}
              setResumeFileUrl={setResumeFileUrl}
              popupChanged={popupChanged}
              setPopupChanged={setPopupChanged}
              emailSubject={emailSubject}
              setEmailSubject={setEmailSubject}
              emailTemplate={emailTemplate}
              setEmailTemplate={setEmailTemplate}
            /> 
          )}
          {activeTab === 'outreach' && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl font-semibold mb-2">Outreach Campaign</h2>
              <p className="text-sm text-gray-400 mb-8 italic">Note: Custom emails can be edited on the "Manage" tab after scheduling</p>
              <div className="space-y-8">
                {firmGroups.map((firmGroup, firmIndex) => (
                  <div key={firmIndex} className="border p-4 rounded-lg">
                    <div className="mb-4">
                      <Select
                        value={firmGroup.firmId} // some reason, id will work here as it will find the firmEmails for me????
                        onValueChange={(value) => updateFirm(firmIndex, value)}
                        disabled={firmGroup.prospects.some(p => p.name !== '')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select firm" />
                        </SelectTrigger>
                        <SelectContent>
                          {firmEmails && Object.keys(firmEmails).map((firmId) => (
                            <SelectItem key={firmId} value={firmId} className=''>
                              {/* <div className="max-w-full border"> */}
                                {/* <div className='border'> */}
                                  {firmEmails[firmId][0]}
                                {/* </div>
                                {firmEmails[firmId][2] === 1 && 
                                  <div className="text-green-500 rounded-sm border-spacing-2 border shadow border-green-500">
                                    Personal
                                  </div>
                                } */}
                              {/* </div> */}
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
                        {firmGroup.prospects.map((prospect, prospectIndex) => {
                          return (
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
                                value={prospect.scheduledTime.localTime}
                                disabled={firmGroup.firm === ""}
                                onChange={(e) => {updateProspect(firmIndex, prospectIndex, 'scheduledTime', e.target.value)}}
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
                        )}
                      )}
                      </TableBody>
                    </Table>
                    <div className="flex justify-between items-center mt-4">
                      <div className='flex'>
                        <Button onClick={() => {
                            if (isNaN(Number(addTempMap[firmIndex]))) {
                              alert("Only numbers are permitted.")
                            } else {
                              for (let i = 0; i < Number(addTempMap[firmIndex]); i++) {
                                addProspect(firmIndex)
                              }
                              addTempMap[firmIndex] = "1"
                            } 
                          }}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Person
                        </Button>
                        <Input 
                          className='ml-4 w-[75px]'
                          value={addTempMap[firmIndex]}
                          onChange={(e) => setAddTempMap((prev) => ({...prev, [firmIndex]: e.target.value}))}
                        />

                      </div>
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
                  {firmGroups.length > 0 && 
                  <div className='flex gap-4'>
                    {/* <Button variant='outline' onClick={createDrafts}>
                      <SaveIcon className="mr-2 h-4 w-4" />
                      Save Drafts
                    </Button> */}
                    <Button onClick={createDrafts}>
                      <Mail className="mr-2 h-4 w-4" />
                      Schedule Emails
                    </Button>
                  </div>
                  }
                    
                </div>
              </div>
            </div>
          )}
          {activeTab === 'settings' && 
            <SettingsPage 
              user={user}
              firmEmails={firmEmails}
              setFirmEmails={setFirmEmails}
              setActiveTab={setActiveTab}
            />}
          {activeTab === 'manage' && <ManagePage />}
        </main>
      </div>
    </div>
  )
}