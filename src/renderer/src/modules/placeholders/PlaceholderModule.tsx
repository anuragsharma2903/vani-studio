import React from 'react'
import { LucideIcon, Terminal, Layers, Sparkles } from 'lucide-react'


interface PlaceholderProps {
  title: string
  description: string
  icon: LucideIcon
  suggestedTools: string[]
}

const PlaceholderModule: React.FC<PlaceholderProps> = ({
  title,
  description,
  icon: Icon,
  suggestedTools
}) => {
  return (
    <div className="h-full flex flex-col justify-center items-center p-8 max-w-3xl mx-auto text-center">
      <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400 shadow-lg shadow-indigo-500/5">
        <Icon className="w-10 h-10" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
        <Sparkles className="w-3.5 h-3.5" />
        Modular Plugin Slot
      </div>

      <h1 className="text-2xl font-bold text-gray-100 mb-2">{title}</h1>
      <p className="text-gray-400 text-sm max-w-md mb-8">{description}</p>

      <div className="w-full bg-[#161922] border border-[#2b3144] rounded-xl p-6 text-left shadow-md">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200 mb-4 pb-3 border-b border-[#2b3144]">
          <Layers className="w-4 h-4 text-indigo-400" />
          How to Snap In This Plugin
        </div>

        <div className="space-y-4 text-xs text-gray-300">
          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p className="font-semibold text-gray-200">Backend Logic (Main Process)</p>
              <p className="text-gray-400">
                Create a module handler in <code className="text-indigo-300 bg-[#0f1117] px-1 py-0.5 rounded">src/main/modules/</code> and register IPC events in <code className="text-indigo-300 bg-[#0f1117] px-1 py-0.5 rounded">src/main/index.ts</code>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </span>
            <div>
              <p className="font-semibold text-gray-200">Preload IPC Bridge</p>
              <p className="text-gray-400">
                Expose your module methods safely in <code className="text-indigo-300 bg-[#0f1117] px-1 py-0.5 rounded">src/preload/index.ts</code>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </span>
            <div>
              <p className="font-semibold text-gray-200">React Module View</p>
              <p className="text-gray-400">
                Add your React component in <code className="text-indigo-300 bg-[#0f1117] px-1 py-0.5 rounded">src/renderer/src/modules/</code> and register it in <code className="text-indigo-300 bg-[#0f1117] px-1 py-0.5 rounded">APP_MODULES</code>.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#2b3144] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-400">Recommended Ecosystem Tools:</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {suggestedTools.map((tool) => (
              <span
                key={tool}
                className="px-2 py-0.5 bg-[#1f2330] text-gray-300 rounded text-[11px] border border-[#2b3144]"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaceholderModule
