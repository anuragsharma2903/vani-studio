import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import { APP_MODULES } from './modules'

export function App(): React.JSX.Element {
  const [activeModuleId, setActiveModuleId] = useState<string>('audio-repo')

  const activeModule = APP_MODULES.find((m) => m.id === activeModuleId) || APP_MODULES[0]
  const ActiveComponent = activeModule.component

  return (
    <div className="flex h-screen w-screen bg-[#0f1117] text-gray-100 antialiased overflow-hidden font-sans select-none">
      {/* Navigation Sidebar */}
      <Sidebar activeModuleId={activeModuleId} onSelectModule={setActiveModuleId} />

      {/* Dynamic Module Workspace */}
      <main className="flex-1 h-full overflow-hidden bg-[#0f1117] flex flex-col">
        <ActiveComponent />
      </main>
    </div>
  )
}

export default App
