'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/db/supabase"
import { User } from '@supabase/supabase-js'
import { getFileUrl } from '@/utils/getFile'
import { EyeIcon } from "lucide-react"

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

export default function ComposedPage({
  user,
  pageLoadingComplete,
  setActiveTab,
  setComposedChanged,
  resumeFilePath,
  setResumeFilePath,
  resumeFileUrl,
  setResumeFileUrl,
  popupChanged,
  setPopupChanged,
  emailSubject,
  setEmailSubject,
  emailTemplate,
  setEmailTemplate
}: PageProps) {
  const [fileNameTemp, setFileNameTemp] = useState<string>('')
  const [file, setFile] = useState<File | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [caretPosition, setCaretPosition] = useState(0);
  const [dropdownOptions] = useState(["Option 1", "Option 2", "Option 3"]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const saveTemplate = async () => {
    const { error } = await supabase.from('composed').upsert([{
      user_profile_id: user?.id,
      subject: emailSubject,
      composed_template: emailTemplate
    }])

    if (!error) {
      if (file) {
        try {
          handleAddResume()
          alert("Template and file has been saved!")
          setActiveTab('outreach')
        } catch (error) {
          alert("An error has occured, please try again later.")
        }
      } else {
        alert("Template has been saved!")
        setActiveTab('outreach')
      }
    } else {
      alert("Issue with saving template, please try again later.")
    }
    setComposedChanged(1)
  }

  const viewResume = () => {
    if (file) {
      const fileURL = URL.createObjectURL(file);
      setFileNameTemp(file.name)
      window.open(fileURL);
      URL.revokeObjectURL(fileURL);
    } else if (resumeFileUrl) {
      setFileNameTemp(decodeURIComponent(resumeFileUrl?.split("/").pop() || ''))
      window.open(resumeFileUrl || '', '_blank', 'noopener,noreferrer')
    } else {
      setFileNameTemp("No Resume Uploaded")
    }
  }

  const handleAddResume = async() => {
    const filePath = `resume/${user?.id}/${file?.name}`;

    if (file && resumeFilePath) {
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
            setResumeFileUrl(publicUrl || '')
            setResumeFilePath(filePath)
          }
        }
      }
    }

    if (file && !resumeFilePath) {
      const { data, error } = await supabase.storage
        .from('resume_link')
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
          setResumeFileUrl(publicUrl || '')
          setResumeFilePath(filePath)
        }
      }
    }
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const handleInputChange = (e: any) => {
    const { value } = e.target;
    const cursorPosition = e.target.selectionStart;
    
    setEmailTemplate(value);
    
    // Check if the last character typed is '/'
    if (value[cursorPosition - 1] === '/') {
      setShowDropdown(true);
      setCaretPosition(cursorPosition); // save the caret position to show dropdown near it
    } else {
      setShowDropdown(false);
    }
  }

  const handleOptionClick = (option: string) => {
    // Replace '/' with the selected option in the email template
    const newTemplate = 
      emailTemplate.substring(0, caretPosition - 1) + 
      option + 
      emailTemplate.substring(caretPosition);

    setEmailTemplate(newTemplate);
    setShowDropdown(false);
  };

  useEffect(() => {
    setFileNameTemp(decodeURIComponent(resumeFileUrl?.split("/").pop() || ''))
  }, [resumeFileUrl])

  useEffect(() => {
    if (file) {
      const fileURL = URL.createObjectURL(file);
      setFileNameTemp(file.name)
    }
  }, [file])

  useEffect(() => {
    if (pageLoadingComplete) {
      setComposedChanged((prev) => prev + 1)
    }
  }, [emailSubject, emailTemplate, file])

  return (
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
              onChange={handleInputChange}
            />
            {showDropdown && (
              <div className="absolute bg-white border shadow-md mt-1 p-2">
                {dropdownOptions.map((option, index) => (
                  <div
                    key={index}
                    className="p-1 cursor-pointer hover:bg-gray-200"
                    onClick={() => handleOptionClick(option)}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col mt-6">
            <Input
              type='file'
              accept='application/pdf'
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Label className='mt-10 max-w-72 leading-normal' >
              <div className="mb-2"><b>Uploaded File:</b></div>
              {fileNameTemp}
            </Label>
            <div className="flex mt-2 gap-2 justify-start">
              <Button
                variant="outline"
                disabled={!resumeFileUrl && !file}
                onClick={viewResume}
              >
                <EyeIcon className="mr-2 h-4 w-4" />
                View Resume
              </Button>
            </div>
          </div>
      </div>
      </div>
      <div className="flex justify-between mt-2">
        <div className="flex">
          <Button variant="outline" onClick={saveTemplate}>Save Template</Button>
        </div>
      </div>
      <Dialog open={popupChanged} onOpenChange={setPopupChanged}>
        <DialogContent className="sm:max-w-[425px] hideClose">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-2">
            <p className="text-sm">
              Before switching tabs, We noticed you forgot to save your template.
            </p>
            <p className="text-sm">
              Confirm below to save.
            </p>
          </div>
          <div className="flex flex-row flex-grow mt-4 items-center gap-2">
            <DialogTrigger asChild>
              <Button
                variant='default'
                size="sm"
                className="w-full"
                onClick={saveTemplate}
              >
                Confirm
              </Button>
            </DialogTrigger>
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
    </div>
  )
}
