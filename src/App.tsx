import { Toaster } from 'react-hot-toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sidebar } from '@/components/layout/Sidebar'
import { MainPane } from '@/components/layout/MainPane'

export default function App() {
  return (
    <TooltipProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        <Sidebar />
        <MainPane />
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'text-sm',
          duration: 4000,
        }}
      />
    </TooltipProvider>
  )
}
