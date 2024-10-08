import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Paperclip } from 'lucide-react'

interface ComposeEmailProps {
  emailSubject: string;
  setEmailSubject: React.Dispatch<React.SetStateAction<string>>;
  emailTemplate: string;
  setEmailTemplate: React.Dispatch<React.SetStateAction<string>>;
  saveTemplate: () => void;
}

export default function ComposeEmail({ emailSubject, setEmailSubject, emailTemplate, setEmailTemplate, saveTemplate }: ComposeEmailProps) {
  return (
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
  )
}
