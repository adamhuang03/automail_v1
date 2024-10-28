'use client';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogTrigger, DialogHeader, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { use, useEffect, useState } from "react"
import { Outreach } from "@/utils/types"
import { supabase } from "@/lib/db/supabase"
import { useRouter } from "next/navigation"
import { Eye, PencilIcon, Trash2Icon } from "lucide-react"

export function ManagePage () {
  const [draftedEmails, setDraftedEmails] = useState<Outreach[]>([]);
  const [localTimeMap, setLocalTimeMap] = useState<{ [id: string]: string }>({});
  const [editableMap, setEditableMap] = useState<{ [id: string]: boolean }>({});
  const router = useRouter();
  // Adding a variable to track refreshes => going to use a quick bool toggle

  const toggleEditable = (id: string) => {
    setEditableMap((prev) => ({
      ...prev,
      [id]: !prev[id], // Toggle editable state for the specific draft
    }));
  };
  const editLocalTime = (id: string, localTime: string) => {
    setLocalTimeMap((prev) => ({
      ...prev,
      [id]: localTime, // Toggle editable state for the specific draft
    }));
  };

  const setEditingOutreach = async(draft: Outreach) => {
    const { error } = await supabase.from('outreach')
    .update({
      status: 'Editing'
    })
    .eq('id', draft.id)
  }

  const setScheduledOutreach = async(draft: Outreach) => {
    const { error } = await supabase.from('outreach')
    .update({
      status: 'Scheduled',
      to_email: draft.to_email,
      to_name: draft.to_name,
      subject_generated: draft.subject_generated,
      email_generated: draft.email_generated,
      scheduled_datetime_utc: draft.scheduled_datetime_utc,
    })
    .eq('id', draft.id)

    // if (error) {
    //   console.log("Error setScheduledOutreach: ", error)
    // } else {
    //   console.log("Good setScheduledOutreach")
    // }
  }

  const updateDraftedEmail = (id: string, field: keyof Outreach, value: string) => {
    setDraftedEmails(prevDrafts =>
      prevDrafts.map(draft =>
        draft.id === id ? { ...draft, [field]: value } : draft
      )
    )
  }

  const utcToLocal = (datetime: string) => {
    const utcTime = new Date(datetime); // Your original UTC time
    const localTime = new Date(utcTime.getTime() - utcTime.getTimezoneOffset() * 60000);
    return localTime.toISOString().slice(0, 16)
  }

  const handleDeleteDraft = async(id: string) => {
    const { error } = await supabase
    .from('outreach')
    .update({status: 'Deleted'})
    .eq('id', id);
    setDraftedEmails((prevRows) => prevRows.filter(row => row.id !== id));
  }

  // Editing this
  useEffect(() => {
    (async() => {
      const { data, error } = await supabase.auth.getSession()
      const session = data.session

      if (session) {
        const { data, error }: {data: Outreach[] | null, error: any} = await supabase.from('outreach')
        .select('*')
        .or('status.eq.Scheduled,status.eq.Editing')
        .eq('user_profile_id', session.user.id)

        if (data) {
          for (const draft of data) {
            // console.log(draft)
            setDraftedEmails(data)
            // if editing add it to the map
          }
        }

      } else {
        router.replace('/login')
      }
    })()
  }, [router])

  return (
      <div className="max-w-6xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Manage Drafted Emails</h2>
            {/* Editing this */}
            <Table> 
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Firm</TableHead>
                  <TableHead>Scheduled Time</TableHead>
                  <TableHead>View Draft</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {draftedEmails.map((draft) => {
                  var isEditable = draft.status === 'Editing' ? true : editableMap[draft.id] || false; // Default to false if not set
                  // console.log('1: ', utcToLocal(draft.scheduled_datetime_utc))
                  // console.log(Object.keys(localTimeMap))
                  // console.log( localTimeMap[draft.id] !== undefined ? localTimeMap[draft.id] : utcToLocal(draft.scheduled_datetime_utc))
                  return (
                  <TableRow key={draft.id}>
                    <TableCell>
                      <Input
                        value={draft.to_name}
                        disabled={true}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={draft.to_email}
                        onChange={(e) => updateDraftedEmail(draft.id, 'to_email', e.target.value)}
                        disabled={!isEditable}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={draft.to_firm}
                        disabled={true}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="datetime-local"
                        value={
                          localTimeMap[draft.id] !== undefined ? localTimeMap[draft.id] : 
                          utcToLocal(draft.scheduled_datetime_utc)
                        }
                        onChange={(e) => {
                          // console.log(localTimeMap[draft.id])
                          editLocalTime(draft.id, e.target.value)
                          const utcTime = new Date(e.target.value).toISOString().slice(0, 16);
                          updateDraftedEmail(draft.id, 'scheduled_datetime_utc', utcTime)
                        }}
                        disabled={!isEditable}
                      />
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={!isEditable}>
                            <Eye className="h-4 w-4 mr-2" />
                            View/Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Edit Email Draft</DialogTitle>
                          </DialogHeader>
                          <div className="mt-2 space-y-4">
                            <div>
                              <Label htmlFor={`subject-${draft.id}`}>Subject</Label>
                              <Input
                                id={`subject-${draft.id}`}
                                value={draft.subject_generated}
                                onChange={(e) => updateDraftedEmail(draft.id, 'subject_generated', e.target.value)}
                                disabled={!isEditable}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`body-${draft.id}`}>Body</Label>
                              <Textarea
                                id={`body-${draft.id}`}
                                value={draft.email_generated}
                                onChange={(e) => updateDraftedEmail(draft.id, 'email_generated', e.target.value)}
                                disabled={!isEditable}
                                className="min-h-[200px]"
                              />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-row">

                        <Button variant="outline" size="sm" onClick={() => {
                            toggleEditable(draft.id)
                            if (isEditable && draft.status === 'Scheduled') {
                              setScheduledOutreach(draft)
                            } else if (isEditable && draft.status === 'Editing') {
                              draft.status = 'Scheduled'
                              setScheduledOutreach(draft)
                            } else {
                              setEditingOutreach(draft)
                            }
                          }}>
                          <PencilIcon className="h-4 w-4 mr-2" />
                          {isEditable ? "Save" : "Edit"}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant='destructive' 
                              size="sm" 
                              className="mx-2" 
                              disabled={!isEditable}
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                            
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px] hideClose" >
                            <DialogHeader>
                              <DialogTitle className="text-red-600">Delete Draft</DialogTitle>
                            </DialogHeader>
                            <div className="mt-2 space-y-2">
                              <p className="text-sm">
                                This action cannot be reversed. Please confirm below.
                              </p>
                            </div>
                            <div className="flex flex-row flex-grow mt-4 items-center gap-2">
                              <Button 
                                variant='destructive' 
                                size="sm" 
                                className="w-full"
                                onClick={() => handleDeleteDraft(draft.id)}
                              >
                                Confirm
                              </Button>
                              <DialogTrigger asChild>
                                <Button
                                  variant='outline'
                                  size="sm"
                                  className="w-full"
                                >
                                  Cancel
                                </Button>
                              </DialogTrigger>
                            </div>
                          </DialogContent>
                        </Dialog>
                        {/* <Button 
                          variant='destructive' 
                          size="sm" 
                          className="mx-2" 
                          disabled={!isEditable}
                          onClick={() => handleDeleteDraft(draft.id)}
                          >
                          <Trash2Icon className="h-4 w-4" />
                        </Button> */}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              </TableBody>
            </Table>
          </div>
  );
}