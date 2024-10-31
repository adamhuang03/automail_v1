"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { AlertCircle, X } from "lucide-react"

interface Firm {
  name: string
  emailEnding: string
}

type PageProps = {
    user: User | null
    pageLoadingComplete: boolean
    setActiveTab: React.Dispatch<React.SetStateAction<string>>
    setComposedChanged: React.Dispatch<React.SetStateAction<number>>
    resumeFilePath: string | null
    setResumeFilePath: React.Dispatch<React.SetStateAction<string | null>>
    resumeFileUrl: string | null
    setResumeFileUrl: React.Dispatch<React.SetStateAction<string | null>>
    popupChanged: boolean
    setPopupChanged: React.Dispatch<React.SetStateAction<boolean>>
    emailSubject: string
    setEmailSubject: React.Dispatch<React.SetStateAction<string>>
    emailTemplate: string
    setEmailTemplate: React.Dispatch<React.SetStateAction<string>>
  };

export default function SettingsPage() {
  const [firmName, setFirmName] = useState("")
  const [emailEnding, setEmailEnding] = useState("")
  const [firms, setFirms] = useState<Firm[]>([])
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firmName || !emailEnding) {
      setError("Please fill in both fields.")
      return
    }
    setError("")
    setFirms([...firms, { name: firmName, emailEnding }])
    setFirmName("")
    setEmailEnding("")
  }

  const removeFirm = (index: number) => {
    setFirms(firms.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setFirms([])
  }

  useEffect(() => {

  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Firm Information</CardTitle>
          <CardDescription>Add multiple firms one by one</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
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
            <h3 className="text-lg font-semibold mb-2">Added Firms:</h3>
            {firms.length === 0 ? (
              <p className="text-gray-500">No firms added yet.</p>
            ) : (
              <ul className="space-y-2">
                {firms.map((firm, index) => (
                  <li key={index} className="flex justify-between items-center bg-white p-2 rounded shadow">
                    <span>{firm.name} - {firm.emailEnding}</span>
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
          <Button variant="outline" onClick={clearAll} className="w-full">Clear All</Button>
        </CardFooter>
      </Card>
    </div>
  )
}