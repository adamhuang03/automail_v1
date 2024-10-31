"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { AlertCircle, X } from "lucide-react"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/db/supabase"
import { siIterm2 } from "simple-icons"

interface Firm {
  name: string
  emailEnding: string
}

type PageProps = {
  user: User | null
  firmEmails: Record<string, [string, string, number]>
  setFirmEmails: React.Dispatch<Record<string, [string, string, number]>>

};

type EmailCollection = {
  firmName: string
  emailEnding: string
}

interface OutreachFirmEmailModified {
  [uuid: string]: {
    firmName: string
    firmEnding: string
    userPrivate: number
    selected: boolean
    cleared: boolean
    added: boolean
  }
}

export default function SettingsPage({
  user,
  firmEmails,
  setFirmEmails
}: PageProps) {
  const [initLoad, setInitLoad] = useState<boolean>(true)
  const [firmName, setFirmName] = useState<string>("")
  const [emailEnding, setEmailEnding] = useState<string>("")
  const [userFirmFormats, setUserFirmFormats] = useState<OutreachFirmEmailModified>({})
  const [userFirmFormatHolder, setUserFirmFormatHolder] = useState<EmailCollection[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [error, setError] = useState("")

  const handleSave = (e: React.FormEvent) => {
    // Save to supabase -- don't let them leave unless they save
    e.preventDefault()
  }

  const addFirmFormat = (e: React.FormEvent) => {
    e.preventDefault()
    const uuid = crypto.randomUUID();
    
    //Feed back to Outreach
    setFirmEmails({
      ...firmEmails,
      [`temp-${uuid}`]: [firmName, emailEnding, 1],
    });
    
    //Prepare for database update
    setUserFirmFormats((prev) => ({
      ...prev,
      [`temp-${uuid}`]: {
        firmName: firmName,
        firmEnding: emailEnding,
        userPrivate: 1,
        selected: false,
        cleared: false,
        added: true
      }
    }));

    setFirmName("")
    setEmailEnding("")

  }

  const clearFirms = (index: number) => {
    setUserFirmFormats(prevFirms => 
      Object.fromEntries( // convert the iteration back into an interface format
        // Iterate each to select true => {key: {...} } => [key, {...}]
        Object.entries(prevFirms).map(([uuid, firm]) => [
          uuid,
          {...firm, cleared: true}
        ])

      )
    )
  }

  const deleteMultipleRecords = async (uuids: string[]) => {
    //uuids would be Object.keys()
    const { data, error } = await supabase
        .from('firm_email_user')
        .delete()
        .in('id', uuids);

    if (error) {
        console.error("Error deleting records:", error.message);
    } else {
        console.log("Records deleted successfully:", data);
    }
  };

  const toggleFirmSelection = (key: string) => {
    setUserFirmFormats(prevFirms => ({
      ...prevFirms,
      [key]: {
        ...prevFirms[key],
        selected: !prevFirms[key].selected
      }
    }));
  };  

  const toggleSelectAll = () => {
    setSelectAll(!selectAll)
    setUserFirmFormats(prevFirms => 
      Object.fromEntries( // convert the iteration back into an interface format
        // Iterate each to select true => {key: {...} } => [key, {...}]
        Object.entries(prevFirms).map(([uuid, firm]) => [
          uuid,
          {...firm, selected: true}
        ])

      )
    )
  }

  useEffect(() => {
    if (initLoad) {
      const filteredFirmEmails = Object.entries(firmEmails).reduce((acc, [key, [str1, str2, num]]) => {
          if (num === 1) {
              acc[key] = {
                firmName: str1,
                firmEnding: str2,
                userPrivate: num,
                selected: false,
                cleared: false,
                added: false
              };
          }
          return acc;
      }, {} as OutreachFirmEmailModified)
      setUserFirmFormats(filteredFirmEmails)
    }
  }, [firmEmails])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Firm Information</CardTitle>
          <CardDescription>Add multiple firms one by one</CardDescription>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firmName">Firm Name</Label>
                <Input
                  id="firmName"
                  placeholder="Enter firm name"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailEnding">Email Ending</Label>
                <Input
                  id="emailEnding"
                  placeholder="e.g. @firmname.com"
                  value={emailEnding}
                  onChange={(e) => setEmailEnding(e.target.value)}
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center text-red-600 space-x-2">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}
            <Button type="submit" className="w-full">Add Firm</Button>
          </CardContent>
        </form>
        <CardContent>
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Added Firms:</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="selectAll"
                  checked={selectAll}
                  onCheckedChange={toggleSelectAll}
                />
                <Label htmlFor="selectAll">Select All</Label>
              </div>
            </div>
            {firms.length === 0 ? (
              <p className="text-gray-500">No firms added yet.</p>
            ) : (
              <ul className="space-y-2">
                {firms.map((firm, index) => (
                  <li key={index} className={`flex justify-between items-center p-2 rounded shadow ${firm.selected ? 'bg-blue-50' : 'bg-white'}`}>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`firm-${index}`}
                        checked={firm.selected}
                        onCheckedChange={() => toggleFirmSelection(index)}
                      />
                      <Label htmlFor={`firm-${index}`} className="flex-grow">
                        {firm.name} - {firm.emailEnding}
                      </Label>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFirm(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={clearSelected} className="w-full">
            Clear Selected
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}