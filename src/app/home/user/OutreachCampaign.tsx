import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, Mail, Upload } from 'lucide-react'

interface Prospect {
  name: string;
  email: string;
  firmName: string;
  scheduledDate: string;
  scheduledTime: string;
}

interface OutreachCampaignProps {
  prospects: Prospect[];
  handleEmailListChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  createDrafts: () => void;
}

export default function OutreachCampaign({ prospects, handleEmailListChange, createDrafts }: OutreachCampaignProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Outreach Campaign</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="emailList" className="block text-sm font-medium text-gray-700 mb-1">
            Enter Email Addresses (comma-separated)
          </label>
          <Textarea
            id="emailList"
            placeholder="john.doe@company.com, jane.smith@firm.com"
            className="min-h-[100px]"
            onChange={handleEmailListChange}
          />
        </div>
        <div>
          <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-1">
            Or Import Email List
          </label>
          <div className="flex items-center space-x-2">
            <Input id="fileUpload" type="file" className="hidden" />
            <Button variant="outline" onClick={() => document.getElementById('fileUpload')?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
            <span className="text-sm text-gray-500">CSV, XLS, or XLSX files accepted</span>
          </div>
        </div>
        {prospects.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Firm</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Email Draft</TableHead>
                  <TableHead>Scheduled Send Date</TableHead>
                  <TableHead>Scheduled Send Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.map((prospect, index) => (
                  <TableRow key={index}>
                    <TableCell>{prospect.name}</TableCell>
                    <TableCell>{prospect.firmName}</TableCell>
                    <TableCell>{prospect.email}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link">
                            <Eye className="mr-2 h-4 w-4" />
                            View Draft
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Email Draft</DialogTitle>
                          </DialogHeader>
                          <div className="mt-2">
                            <h3 className="text-sm font-semibold mb-1">Subject:</h3>
                            <p className="text-sm text-gray-700 mb-4">{prospect.name}</p>
                            <h3 className="text-sm font-semibold mb-1">Body:</h3>
                            <p className="text-sm text-gray-500 whitespace-pre-wrap">[BODY]</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <Input type="date" value={prospect.scheduledDate} />
                    </TableCell>
                    <TableCell>
                      <Input type="time" value={prospect.scheduledTime} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end">
              <Button onClick={createDrafts}>
                <Mail className="mr-2 h-4 w-4" />
                Create Drafts
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
