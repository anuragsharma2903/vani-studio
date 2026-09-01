import React from 'react'
import { Sparkles, Radio, Cloud } from 'lucide-react'
import { APP_MODULES, AppModule } from '../modules'
import logoImg from '../assets/logo.png'

interface SidebarProps {
  activeModuleId: string
  onSelectModule: (moduleId: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ activeModuleId, onSelectModule }) => {
  const coreModules = APP_MODULES.filter((m) => m.category === 'core')
  const pluginModules = APP_MODULES.filter((m) => m.category === 'plugin')
  const systemModules = APP_MODULES.filter((m) => m.category === 'system')

  const renderModuleButton = (module: AppModule) => {
    const Icon = module.icon
    const isActive = activeModuleId === module.id

    return (
      <button
        key={module.id}
        onClick={() => onSelectModule(module.id)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition group ${
          isActive
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30'
            : 'text-gray-400 hover:text-gray-100 hover:bg-[#1b1f2c] border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition shrink-0 ${
              isActive
                ? 'bg-white/20 text-white'
                : 'bg-[#161a26] text-gray-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="truncate font-semibold tracking-tight">{module.name}</span>
        </div>

        {module.badge && (
          <span
            className={`text-[9px] px-2 py-0.5 rounded-full font-semibold shrink-0 ml-1.5 ${
              isActive
                ? 'bg-white/25 text-white backdrop-blur-sm'
                : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
            }`}
          >
            {module.badge}
          </span>
        )}
      </button>
    )
  }

  return (
    <aside className="w-64 bg-[#10121a] border-r border-[#242938] flex flex-col justify-between select-none shrink-0 h-full">
      {/* App Header / Logo */}
      <div>
        <div className="p-4 border-b border-[#242938] bg-gradient-to-b from-[#161925] to-[#10121a] flex items-center gap-3">
          <div className="relative group shrink-0">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-amber-500 rounded-xl blur opacity-40 group-hover:opacity-75 transition duration-500" />
            <img
              src={logoImg}
              alt="Vani Studio Logo"
              className="relative w-9 h-9 rounded-xl object-cover border border-indigo-400/30 shadow-md"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-black tracking-wider text-gray-100 uppercase bg-gradient-to-r from-indigo-200 via-purple-200 to-amber-200 bg-clip-text text-transparent">
                Vāṇī Studio
              </h1>
              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-gray-400 truncate">Sacred Audio & Cloud Vault</p>
          </div>
        </div>

        {/* Modules Navigation */}
        <div className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-145px)]">
          {/* Core Studio */}
          <div>
            <div className="px-3 pb-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Radio className="w-2.5 h-2.5 text-indigo-400" />
              <span>Core Studio Vault</span>
            </div>
            <div className="space-y-1">{coreModules.map(renderModuleButton)}</div>
          </div>

          {/* Plugin Slots */}
          <div>
            <div className="px-3 pb-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>Extensions & AI</span>
              </span>
            </div>
            <div className="space-y-1">{pluginModules.map(renderModuleButton)}</div>
          </div>

          {/* System & Settings */}
          <div>
            <div className="px-3 pb-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              System & Preferences
            </div>
            <div className="space-y-1">{systemModules.map(renderModuleButton)}</div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Cloud Status */}
      <div className="p-3 border-t border-[#242938] bg-[#0c0e14]">
        <div className="flex items-center justify-between text-[11px] text-gray-400 px-2 py-1 bg-[#131620] border border-[#242938] rounded-lg">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Cloud className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            R2 Cloud Vault Live
          </span>
          <span className="text-[9px] font-mono text-gray-400 px-1.5 py-0.5 rounded bg-black/40 border border-white/5">
            v1.0.0
          </span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
