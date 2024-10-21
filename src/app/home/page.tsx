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
import { sendEmail } from '@/utils/sendGmail'
import { ManagePage } from './managePage'
import { getFileUrl } from '@/utils/getFile'
import { v4 as uuid } from 'uuid';
import {decode} from 'base64-arraybuffer'

// const firmEmails: { [key: string]: string } = {
//   "TD Securities": "tdsecurities.com",
//   "RBC Capital Markets": "rbccm.com",
//   "CIBC Capital Markets": "cibccapitalmarkets.com",
//   "Scotiabank Global Banking & Markets": "scotiabank.com",
//   "BMO Capital Markets": "bmocapitalmarkets.com",
//   "National Bank Financial Markets": "nbf.ca",
//   "Goldman Sachs": "gs.com",
//   "Evercore": "evercore.com",
//   "Lazard": "lazard.com",
//   "Morgan Stanley": "morganstanley.com",
//   "Bank of America": "bofa.com",
//   "University of Toronto": "mail.utoronto.ca"
// }

// const firms = [
//     "TD Securities",
//     "RBC Capital Markets",
//     "CIBC Capital Markets",
//     "Scotiabank Global Banking & Markets",
//     "BMO Capital Markets",
//     "National Bank Financial Markets",
//     "Goldman Sachs",
//     "Evercore",
//     "Lazard",
//     "Morgan Stanley",
//     "Bank of America"
// ]

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
  const [firmEmails, setFirmEmails] = useState<Record<string, [string, string]> | null>(null)
  const [addTempMap, setAddTempMap] = useState<{ [id: number]: string }>({});

  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null);
  const [fileNameTemp, setFileNameTemp] = useState<string>('')
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null); // Create a ref for the file input

  const saveTemplate = async () => {
    const { error } = await supabase.from('composed').upsert([{
      user_profile_id: user?.id,
      subject: emailSubject,
      composed_template: emailTemplate
    }])

    if (!error) {
      // console.log("Template saved:", { subject: emailSubject, body: emailTemplate })
      alert("Template has been saved!")
    } else {
      alert("Issue with saving template, please try again later.")
    }
  }

  const utcToLocal = (datetime: string) => {
    const utcTime = new Date(datetime); // Your original UTC time
    const localTime = new Date(utcTime.getTime() - utcTime.getTimezoneOffset() * 60000);
    return localTime.toISOString().slice(0, 16)
  }

  const addFirm = () => {
    const currentDate = utcToLocal(new Date().toISOString())
    const updatedFirmGroups = [...firmGroups, { firm: '', prospects: [{ name: '', email: '', scheduledTime: {utcTime: '', localTime: currentDate} }] }]
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
    const updatedFirmGroups = [...firmGroups]
    updatedFirmGroups[firmIndex].prospects.push({ name: '', email: '', scheduledTime: {utcTime: '', localTime: currentDate} })
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
      if (prospect.name && firmEmails) {
        const [firstName, lastName] = prospect.name.split(' ')
        prospect.email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${firmEmails[newFirm][0]}`
      }
    })
    setFirmGroups(updatedFirmGroups)
  }

  const updateProspect = (firmIndex: number, prospectIndex: number, field: keyof Prospect, value: string) => {
    const updatedFirmGroups = [...firmGroups]
    const currentFirmGroup = updatedFirmGroups[firmIndex]
    const currentProspect = currentFirmGroup.prospects[prospectIndex]

    if (field === 'name' && currentFirmGroup.firm) {
      currentProspect[field] = value
      const [firstName, lastName] = value.split(' ')
      if (firstName && lastName && firmEmails) {
        currentProspect.email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${firmEmails[currentFirmGroup.firm][0]}`
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
      firm_email_id: number,
      subject_generated: string,
      email_generated: string,
      scheduled_datetime_utc: string
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
        if (firmEmails && user) {
          const draft = generateDraft(prospect, firmGroup.firm)
          data.push({
            status: "Scheduled",
            user_profile_id: user.id,
            to_name: prospect.name,
            to_email: prospect.email,
            to_firm: firmGroup.firm,
            firm_email_id: Number(firmEmails[firmGroup.firm][1]),
            subject_generated: draft.subject,
            email_generated: draft.body,
            scheduled_datetime_utc: prospect.scheduledTime.utcTime
          });
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

  const generateDraft = (prospect: Prospect, firm: string) => { // First name only
    let subject = emailSubject.replace('[NAME]', prospect.name.split(' ')[0]).replace('[FIRM_NAME]', firm)
    let body = emailTemplate.replace('[NAME]', prospect.name.split(' ')[0]).replace('[FIRM_NAME]', firm)
    return { subject, body }
  }

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

  const handleAddResume = async() => {
    setUploading(true)

    // const fileExt = file?.name.split('.').pop();
    // const fileName = `${uuid()}.${fileExt}`; // Generating a random file name
    const filePath = `resume/${user?.id}/${file?.name}`;


    if (file && resumeFilePath) {
      // const { data, error } = await supabase
      //   .storage
      //   .from('resume_link')
      //   .update(resumeFilePath, file, {
      //     contentType: 'application/pdf',
      //     cacheControl: '3600',
      //     upsert: true
      //   })
      const { data, error } = await supabase
        .storage
        .from('resume_link')
        .remove([resumeFilePath])

      if (error) {
        alert("Code F3: File replace error. Please try again later.")
      } else {

        const { data, error } = await supabase
          .storage
          .from('resume_link')
          .upload(filePath, file);
        
        const publicUrl = await getFileUrl(filePath, "resume_link")

        if (error) {
          alert("Code F4: File replace error. Please try again later.")

        } else {
          const { error } = await supabase.from('composed').upsert([{
            user_profile_id: user?.id,
            resume_link_filepath: filePath,
            resume_link: publicUrl
          }])
  
          if (error) {
            alert("Code F5: File replace error. Please try again later.")
          } else {
            setResumeFileUrl(publicUrl)
            setResumeFilePath(filePath)
            alert("Your file has been re-uploaded!")
          }
        }
        
      }

    }

    if (file && !resumeFilePath) {
      const { data, error } = await supabase.storage
        .from('resume_link')  // Replace with your actual bucket name
        .upload(filePath, file);

      if (error) {
        console.log(error)
        alert("Code F1: File upload error. Please try again later.")
        
      } else {
        const publicUrl = await getFileUrl(filePath, "resume_link")

        const { error } = await supabase.from('composed').upsert([{
          user_profile_id: user?.id,
          resume_link_filepath: filePath,
          resume_link: publicUrl
        }])

        if (error) {
          alert("Code F2: File upload error. Please try again later.")
        } else {
          setResumeFileUrl(publicUrl)
          setResumeFilePath(filePath)
          alert("Your file has been uploaded!")
        }
      }
      
    }
    setUploading(false)
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset the file input to an empty string
    }
  }

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

      const { data, error } = await supabase.from('firm_email')
      .select('firm_name')

      if (data) {
        const firmNames = data.map<string>((item) => item.firm_name);
        setFirms(firmNames)
      }
    })();

    (async() => {
      const { data, error } = await supabase.from('firm_email')
      .select('id, firm_name, email_ending')
      if (data) {
        const firmEmailsDict = data.reduce<Record<string, [string, string]>>((acc, item) => {
          acc[item.firm_name] = [item.email_ending, item.id];
          return acc;
        }, {});
        setFirmEmails(firmEmailsDict)
      }

    })();

    (async() => {
      // const { data: emails, error }: { data: Outreach[] | any; error: any } = await supabase
      // .from('outreach')
      // .select(`
      //     *,
      //     user_profile!user_profile_id (provider_token, provider_refresh_token)
      // `)
      // .eq('status', 'Scheduled')
      // console.log(new Date().toISOString().slice(0, 16))
    })();

  }, [])

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
        } else {
          setEmailSubject('')
          setEmailTemplate('')
          setResumeFilePath(null)
          setResumeFileUrl(null)
        }
      }

    })();
  }, [user])

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 border-r border-gray-200 p-4">
        <div className="flex items-center mb-8">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={user?.user_metadata.avatar_url} alt={`${user?.user_metadata.full_name}} User`} />
            <AvatarFallback>US</AvatarFallback>
          </Avatar>
          <span className="font-semibold">{user?.user_metadata.full_name}</span>
        </div>
        <nav className='flex flex-col'>
          <Button
            variant={activeTab === 'compose' ? 'outline' : 'ghost'}
            className="w-full justify-start mb-2"
            onClick={() => setActiveTab('compose')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Compose
          </Button>
          <Button
            variant={activeTab === 'outreach' ? 'outline' : 'ghost'}
            className="w-full justify-start mb-2"
            onClick={() => setActiveTab('outreach')}
          >
            <Mail className="mr-2 h-4 w-4" />
            Outreach
          </Button>
          <Button
            variant={activeTab === 'manage' ? 'outline' : 'ghost'}
            className="w-full justify-start mb-2"
            onClick={() => setActiveTab('manage')}
          >
            <InboxIcon className="mr-2 h-4 w-4" />
            Manage
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'outline' : 'ghost'}
            className="w-full justify-start mb-2"
            onClick={() => setActiveTab('settings')}
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
            <div className="max-w-5xl mx-auto">
              <h2 className="text-lg font-semibold mb-4">Compose Email Template</h2>
              <div className="flex flex-row">
                
                <div className='flex flex-grow justify-between gap-8'>
                  <div className="flex-1 space-y-4">
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
                </div>
                <div className="flex flex-col mt-6">
                    <Input 
                      type='file' 
                      accept='application/pdf'
                      ref={fileInputRef}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex mt-2 gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        disabled={!resumeFileUrl}
                        onClick={() => window.open(
                          resumeFileUrl || '', '_blank', 'noopener,noreferrer'
                        )}
                      >
                        <EyeIcon className="mr-2 h-4 w-4" />
                        View Resume
                      </Button>
                      <Button variant="outline" onClick={handleAddResume} disabled={!file}>
                        <Paperclip className="mr-2 h-4 w-4" />
                        {uploading ? 'Attaching...' : 'Attach Resume '}
                      </Button>
                    </div> 
                    <Label className='mt-4 max-w-72 leading-normal' >
                      <div className="mb-2"><b>Uploaded File:</b></div>
                      {resumeFilePath ? resumeFileUrl?.split("/").pop() : "No Resume Uploaded"}
                    </Label>
                  </div>

              </div>
              </div>
                <div className="flex justify-between mt-2">
                  <div className="flex">
                    <Button variant="outline" onClick={saveTemplate}>Save Template</Button>
                  </div>
                </div>
            </div>
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
                        value={firmGroup.firm}
                        onValueChange={(value) => updateFirm(firmIndex, value)}
                        disabled={firmGroup.prospects.some(p => p.name !== '')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select firm" />
                        </SelectTrigger>
                        <SelectContent>
                          {firms?.map((firm) => (
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
          {activeTab === 'settings' && <div>Settings page coming soon!</div>}
          {activeTab === 'manage' && <ManagePage />}
        </main>
      </div>
    </div>
  )
}