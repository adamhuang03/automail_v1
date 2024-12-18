'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandList, CommandItem, CommandGroup, CommandInput } from "@/components/ui/command"


import { useState, useRef, useEffect, useCallback, MutableRefObject } from "react"
import { supabase } from "@/lib/db/supabase"
import { User } from '@supabase/supabase-js'
import { getFileUrl } from '@/utils/getFile'
import { EyeIcon, HandHelping, HelpCircle, HelpCircleIcon, Trash } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@radix-ui/react-hover-card"
import axios from "axios"

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [chosenRef, setChosenRef] = useState<HTMLTextAreaElement | null>(null);

  // Dropdown
  const dropdownOptions: Record<string, string> = {
    "Name": "[NAME]", 
    "Firm": "[FIRM_NAME]"
  }
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState({
    rectTop: 0,
    rectLeft: 0,
    caretTop: 0,
    caretLeft: 0,
  });
  const [commandMode, setCommandMode] = useState(false);
  const [prevCommandLen, setPrevCommandLen] = useState(0);
  const [commandCursorPosition, setCommandCursorPosition] = useState(0);
  const [command, setCommand] = useState<string>('')
  const [activeOptionIndex, setActiveOptionIndex] = useState<number>(0);
  const [filteredOptions, setFilteredOptions] = useState<Record<string, string>>(dropdownOptions);
  
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

  const deleteResume = async () => {
    if (resumeFilePath && !file) {
      const { data, error: removeError } = await supabase
        .storage
        .from('resume_link')
        .remove([resumeFilePath])
      
      
      
      if (removeError) {
        alert("Error removing resume, please try again later.")
      } else {
        await supabase.from('composed')
        .update({ resume_link: null, resume_link_filepath: null, resume_link_pdfcontent: null })
        .eq('user_profile_id', user?.id);
      }
      setResumeFilePath(null)
      setFileNameTemp('')
      setResumeFileUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } else if (resumeFilePath && file) {
      const { data, error: removeError } = await supabase
        .storage
        .from('resume_link')
        .remove([resumeFilePath])
      
      if (removeError) {
        alert("Error removing resume, please try again later.")
      } else {
        await supabase.from('composed')
        .update({ resume_link: null, resume_link_filepath: null, resume_link_pdfcontent: null })
        .eq('user_profile_id', user?.id);
      }
      setResumeFilePath(null)
      setResumeFileUrl(null)
      setFileNameTemp('')
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } else if (!resumeFilePath && file) {
      setFile(null)
      setFileNameTemp('')
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

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
        const response = await axios.get(publicUrl || "", { responseType: 'arraybuffer' });
        const pdfContent = Buffer.from(response.data).toString('base64');

        if (error) {
          alert("Code F4: File replace error. Please try again later.")
        } else {
          const { error } = await supabase.from('composed').upsert([{
            user_profile_id: user?.id,
            resume_link_filepath: filePath,
            resume_link: publicUrl,
            resume_link_pdfcontent: pdfContent
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
        const response = await axios.get(publicUrl || "", { responseType: 'arraybuffer' });
        const pdfContent = Buffer.from(response.data).toString('base64');

        const { error } = await supabase.from('composed').upsert([{
          user_profile_id: user?.id,
          resume_link_filepath: filePath,
          resume_link: publicUrl,
          resume_link_pdfcontent: pdfContent
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>, setAction: React.Dispatch<React.SetStateAction<string>>) => {
    const value = e.target.value;
    setChosenRef((e.target as HTMLTextAreaElement))
    setAction(value)
    // console.log(commandMode)
    // console.log(filteredOptions)

    if (value.charAt(commandCursorPosition - 1) !== '/') {
      resetCommand()
    }
  }
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>, setAction: React.Dispatch<React.SetStateAction<string>>) => {
    const keysArray = Object.keys(filteredOptions); // Convert keys to an array
    if (commandMode) {
      // e.preventDefault()// Prevent cursor movement
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveOptionIndex((prevIndex) => 
          (prevIndex + 1) % keysArray.length); // Move down
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveOptionIndex((prevIndex) => 
          (prevIndex - 1 + keysArray.length) % keysArray.length); // Move up
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        handleOptionSelect(filteredOptions[keysArray[activeOptionIndex]], setAction);
      }
    }
  }, [commandMode, filteredOptions, activeOptionIndex])

  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {

    const cursorPosition = (e.target as HTMLTextAreaElement).selectionStart;
    const isAlphaNumeric = /^[a-zA-Z0-9]$/.test(e.key);
    // console.log("Cursor", cursorPosition, "command Cursor", commandCursorPosition)
    
    if (e.key === '/') {
      setCommandCursorPosition(cursorPosition)
      setCommandMode(true);
      setFilteredOptions(dropdownOptions)
      setShowDropdown(true)
    } else if (e.key === 'Escape') {

      resetCommand()
    } else if (e.key === ' ') {

      resetCommand()
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      
      if (cursorPosition < commandCursorPosition) {
        resetCommand({ resetCommandCursor: false })
      } else if (cursorPosition >= commandCursorPosition && Math.abs(cursorPosition-commandCursorPosition) <= 1) {
        setCommandMode(true);
        setFilteredOptions(dropdownOptions)
        setShowDropdown(true);
      }
    } else if (e.key === 'Backspace') {
      setCommand((prev) => prev.slice(0, -1))
    } else if (isAlphaNumeric) {
      setCommand((prev) => prev + e.key)
    }
    
  }, [commandMode, commandCursorPosition, dropdownOptions]); 

  useEffect(() => {
    if (commandMode) {
      // console.log(command, "Command Start:", commandCursorPosition, 'Command len:', command.length)
      if (prevCommandLen <= command.length) {
        const filteredEntries = Object.entries(dropdownOptions).filter(([key, value]) =>
          key.toLocaleLowerCase().includes(command)
        );
        setFilteredOptions(Object.fromEntries(filteredEntries));
      } else {
        setFilteredOptions(dropdownOptions)
        const filteredEntries = Object.entries(dropdownOptions).filter(([key, value]) =>
          key.toLocaleLowerCase().includes(command)
        );
        setFilteredOptions(Object.fromEntries(filteredEntries));
      }
      setPrevCommandLen(command.length)
    }
  },[command] )

  const handleOptionSelect = (option: string, setAction: React.Dispatch<React.SetStateAction<string>>) => {
    // console.log(commandCursorPosition, commandCursorPosition + prevCommandLen)
    setAction(prevTemplate => 
      prevTemplate.slice(0, commandCursorPosition - 1) + option + prevTemplate.slice(commandCursorPosition + prevCommandLen, prevTemplate.length)
    );
    resetCommand()
  }

  const resetCommand = ({position = -5, resetCommandCursor = true}: { position?: number; resetCommandCursor?: boolean; } = {}) => {
    setCommand('')
    setShowDropdown(false);
    setCommandMode(false);
    setFilteredOptions(dropdownOptions)
    if (resetCommandCursor) {
      setCommandCursorPosition(position)
    }
  }

  const getTextareaPosition = (ref: HTMLTextAreaElement | null) => {
    if (ref) {
      const { top, left } = ref.getBoundingClientRect();
      setDropdownCoords((coords) => ({
        ...coords,
        rectTop: top,
        rectLeft: left,
      }));
    }
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
  
  useEffect(() => {
    getTextareaPosition(chosenRef);
  }, [chosenRef])

  return (
    <div className="max-w-5xl mx-auto overflow-visible">
      <h2 className="text-lg font-semibold mb-4">Compose Email Template</h2>
      <div className="flex flex-row">
        <div className='flex flex-grow justify-between gap-8'>
          <div className="flex-1 space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <div className="flex flex-row gap-2">
                <Textarea
                  id="subject"
                  placeholder="Enter email subject"
                  className="min-h-[40px] max-h-[40px]"
                  value={emailSubject}
                  ref={inputRef}
                  onChange={(e) => handleInputChange(e, setEmailSubject)}
                  onKeyDownCapture={(e) => handleKeyDown(e, setEmailSubject)}
                  onKeyUpCapture={handleKeyUp}
                />
                <HoverCard openDelay={400} closeDelay={300}>
                  <HoverCardTrigger asChild>
                    <Button variant="outline">
                      <HelpCircle />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-100 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="flex space-x-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-800">Having trouble?</h4>
                        <p className="text-sm text-gray-600">
                          You can start by typing in a subject and template!
                        </p>
                        <p className="text-sm text-gray-600">
                          {`... Feel free to also attach a file afterwards whenever you get a chance :)`}
                        </p>
                        <br></br>
                        <p className="text-sm text-gray-600">
                          If you ever want to add <b>placeholders</b>, simply type ‘ / ’ ...
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
          <div>
            <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
              Email Template
            </label>
            <Textarea
              id="template"
              ref={textareaRef}
              placeholder="Write template here, use ‘ / ’ for placeholders..."
              className="min-h-[200px]"
              value={emailTemplate}
              onChange={(e) => handleInputChange(e, setEmailTemplate)}
              onKeyDownCapture={(e) => handleKeyDown(e, setEmailTemplate)}
              onKeyUpCapture={handleKeyUp}
            />
            
            {showDropdown && (//${Math.round(dropdownCoords.top)}
                <div 
                  className={`bg-white border border-gray-300 rounded-md shadow-lg`}
                  style={{
                    position: 'absolute',
                    bottom: `${window.innerHeight - dropdownCoords.rectTop}px`,
                    left: `${dropdownCoords.rectLeft}px`,
                  }}
                >
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {Object.entries(filteredOptions).map(([key, value], index) => (
                          <CommandItem 
                            key={index} 
                            onSelect={() => handleOptionSelect(value, chosenRef === inputRef.current ? setEmailSubject : setEmailTemplate)}
                            className={`hideHighlight cursor-pointer p-2 hover:bg-gray-100 ${index === activeOptionIndex ? 'bg-gray-200 !important' : ''}`}
                            aria-selected={index === activeOptionIndex}
                            data-selected={index === activeOptionIndex}
                          >
                            {key}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
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
              {fileNameTemp ? fileNameTemp : <div><i>No file available</i></div>}
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
              <Button
                variant="destructive"
                disabled={!resumeFileUrl && !file}
                onClick={deleteResume}
              >
                <Trash className="h-4 w-4" />
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
