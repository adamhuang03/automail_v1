import { Button } from "@/components/ui/button"
import { Mail, PlusCircle, Settings, User } from 'lucide-react'

interface SidebarProps {
  activeTab: 'compose' | 'outreach' | 'settings';
  setActiveTab: React.Dispatch<React.SetStateAction<'compose' | 'outreach' | 'settings'>>;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-100 border-r border-gray-200 p-4">
      <div className="flex items-center mb-8">
        <User className='border-solid bg-white rounded-full'/>
        <span className="ml-2 font-semibold">University Student</span>
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
  )
}
