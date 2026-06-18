// Color palette data matching the design system screenshot
const colorPalettes = [
  {
    name: 'Primary',
    hex: '#0061FF',
    bg: 'bg-[#0061FF]',
    shades: ['#0052dc', '#1a6fff', '#3d85ff', '#6ba3ff', '#99c0ff', '#cce0ff', '#e5f0ff', '#f0f7ff'],
  },
  {
    name: 'Secondary',
    hex: '#475569',
    bg: 'bg-[#475569]',
    shades: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f8fafc'],
  },
  {
    name: 'Tertiary',
    hex: '#7A7390',
    bg: 'bg-[#7A7390]',
    shades: ['#3a344e', '#4d4762', '#625b77', '#7a7390', '#a09ab5', '#cec5e5', '#e8e4f4', '#f5f3fb'],
  },
  {
    name: 'Neutral',
    hex: '#F8FAFC',
    bg: 'bg-[#94a3b8]',
    shades: ['#0f172a', '#1e293b', '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f8fafc'],
    light: true,
  },
]

const typeSamples = [
  { role: 'Headline', font: 'Manrope', fontClass: 'font-headline' },
  { role: 'Body', font: 'Inter', fontClass: 'font-body' },
  { role: 'Label', font: 'Inter', fontClass: 'font-label' },
]

export default function DesignSystem() {
  return (
    <div className="p-8">
      <div className="mb-10">
        <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
          Design System
        </h2>
        <p className="text-on-surface-variant font-medium">
          Tokens, typography, components and iconography.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Color Palettes */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          {colorPalettes.map((palette) => (
            <div key={palette.name} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
              <div className={`${palette.bg} px-4 py-3 flex justify-between items-center`}>
                <span className={`font-bold text-sm ${palette.light ? 'text-on-surface' : 'text-white'}`}>
                  {palette.name}
                </span>
                <span className={`text-xs font-mono ${palette.light ? 'text-on-surface-variant' : 'text-white/70'}`}>
                  {palette.hex}
                </span>
              </div>
              <div className="flex h-8">
                {palette.shades.map((shade) => (
                  <div key={shade} className="flex-1" style={{ backgroundColor: shade }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Typography */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          {typeSamples.map((t) => (
            <div key={t.role} className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-on-surface-variant">{t.role}</span>
                <span className="text-xs text-on-surface-variant">{t.font}</span>
              </div>
              <div className={`text-7xl font-medium text-on-surface ${t.fontClass} mt-auto`}>Aa</div>
            </div>
          ))}
        </div>

        {/* Buttons & Inputs */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          {/* Buttons */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-primary text-on-primary font-bold py-2 px-4 rounded-lg text-sm">
                Primary
              </button>
              <button className="bg-secondary text-on-secondary font-bold py-2 px-4 rounded-lg text-sm">
                Secondary
              </button>
              <button className="bg-on-surface text-surface font-bold py-2 px-4 rounded-lg text-sm">
                Inverted
              </button>
              <button className="border-2 border-outline text-on-surface font-bold py-2 px-4 rounded-lg text-sm bg-transparent">
                Outlined
              </button>
            </div>
          </div>

          {/* Dividers */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col gap-3 justify-center flex-1">
            <div className="h-0.5 bg-primary rounded-full" />
            <div className="h-0.5 bg-outline-variant rounded-full" />
            <div className="h-0.5 bg-outline-variant/50 rounded-full" />
          </div>

          {/* Icon buttons */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex items-center justify-around">
            <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-xl">home</span>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-xl">person</span>
            </button>
          </div>
        </div>

        {/* Search & FABs */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          {/* Search input */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">
                search
              </span>
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-surface-container border border-outline-variant/40 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Label chips */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex items-center gap-3 flex-wrap">
            <button className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-xl">edit</span>
            </button>
            <button className="flex items-center gap-2 bg-primary-container text-on-primary-container px-4 py-2 rounded-full text-sm font-medium hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-base">edit</span>
              Label
            </button>
          </div>

          {/* FAB row */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex items-center justify-around flex-1">
            <button className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-lg hover:scale-105 transition-transform">
              <span className="material-symbols-outlined">build</span>
            </button>
            <button className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-lg hover:scale-105 transition-transform">
              <span className="material-symbols-outlined">hub</span>
            </button>
            <button className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container shadow-lg hover:scale-105 transition-transform">
              <span className="material-symbols-outlined">pentagon</span>
            </button>
            <button className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center text-on-error-container shadow-lg hover:scale-105 transition-transform">
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
