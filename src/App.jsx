import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, ArrowRight, Check, ChevronDown, CircleHelp, Copy, ImagePlus, LockKeyhole, Menu, MousePointer2, Plus, RotateCw, Shuffle, Sparkles, Upload, X } from 'lucide-react'

const initialColors = ['#D8A16E', '#B86D43', '#E3C9A2', '#713D2F', '#A45B45', '#F0DCC0']
const samples = [
  { name: 'Dune afternoon', emoji: '✳', colors: ['#E8B07B', '#D27948', '#B95E3E', '#723F33', '#E5D0B0', '#F2E5D2'] },
  { name: 'After the rain', emoji: '◒', colors: ['#627B73', '#A7B5A0', '#D7C7A8', '#51606A', '#CF9A74', '#E5D9C4'] },
  { name: 'Soft focus', emoji: '✴', colors: ['#D29A8E', '#E7C5B5', '#B9786B', '#7B5261', '#E8D6C4', '#AFB9A1'] },
]

function hexToRgb(hex) { const n = parseInt(hex.replace('#', ''), 16); return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})` }
function rgbToHex(r, g, b) { return `#${[r, g, b].map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('')}`.toUpperCase() }
function rgbToHsl(hex) { const n = parseInt(hex.slice(1), 16), r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, max = Math.max(r, g, b), min = Math.min(r, g, b); let h, s, l = (max + min) / 2; if (max === min) h = s = 0; else { const d = max - min; s = l > .5 ? d / (2 - max - min) : d / (max + min); switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; default: h = (r - g) / d + 4 }; h /= 6 } return [h * 360, s * 100, l * 100] }
function hslToHex(h, s, l) { h /= 360; s /= 100; l /= 100; const a = s * Math.min(l, 1 - l); const f = n => { const k = (n + h * 12) % 12, color = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(255 * color) }; return rgbToHex(f(0), f(8), f(4)) }
function IconMark() { return <div className="mark"><span /><span /><span /><span /></div> }

export default function App() {
  const [colors, setColors] = useState(initialColors)
  const [locked, setLocked] = useState({})
  const [image, setImage] = useState(null)
  const [filename, setFilename] = useState('A little afternoon light.jpg')
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState('')
  const [notice, setNotice] = useState('')
  const [dragging, setDragging] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [custom, setCustom] = useState('#C8FF51')
  const inputRef = useRef(null)
  const canvasRef = useRef(null)
  const noticeTimer = useRef(null)

  const announce = useCallback((message) => { setNotice(message); clearTimeout(noticeTimer.current); noticeTimer.current = setTimeout(() => setNotice(''), 2600) }, [])
  const sample = samples[0]
  const setSample = (item) => { setColors(item.colors); setFilename(`${item.name.toLowerCase().replaceAll(' ', '-')}.jpg`); setImage(null); setLocked({}); announce(`${item.name} palette loaded`) }

  const extract = useCallback((file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { announce('That file isn’t an image. Try JPG, PNG, or WebP.'); return }
    const url = URL.createObjectURL(file); const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current; const ctx = canvas.getContext('2d', { willReadFrequently: true }); const scale = Math.min(1, 180 / Math.max(img.naturalWidth, img.naturalHeight)); canvas.width = Math.max(1, Math.round(img.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(img.naturalHeight * scale)); ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height); const bins = new Map()
      for (let i = 0; i < data.length; i += 16) { const a = data[i + 3]; if (a < 160) continue; const r = data[i] >> 4, g = data[i + 1] >> 4, b = data[i + 2] >> 4, key = `${r},${g},${b}`, prev = bins.get(key) || { count: 0, r: 0, g: 0, b: 0 }; prev.count++; prev.r += data[i]; prev.g += data[i + 1]; prev.b += data[i + 2]; bins.set(key, prev) }
      const sorted = [...bins.values()].sort((a, b) => b.count - a.count); const picked = []
      for (const p of sorted) { const c = rgbToHex(Math.round(p.r / p.count), Math.round(p.g / p.count), Math.round(p.b / p.count)); if (picked.every(q => { const [h1, s1, l1] = rgbToHsl(c), [h2, s2, l2] = rgbToHsl(q); return Math.abs(h1 - h2) > 15 || Math.abs(l1 - l2) > 10 || Math.abs(s1 - s2) > 18 })) picked.push(c); if (picked.length === 6) break }
      while (picked.length < 6 && sorted.length) { const p = sorted[picked.length % sorted.length]; picked.push(rgbToHex(Math.round(p.r / p.count), Math.round(p.g / p.count), Math.round(p.b / p.count))) }
      setColors(prev => prev.map((c, i) => locked[i] ? c : picked[i] || c)); setImage(url); setFilename(file.name); announce('Six colors, freshly caught')
    }
    img.onerror = () => { URL.revokeObjectURL(url); announce('Couldn’t read that image. Try another file.') }; img.src = url
  }, [announce, locked])

  useEffect(() => () => { clearTimeout(noticeTimer.current); if (image?.startsWith('blob:')) URL.revokeObjectURL(image) }, [image])
  const copy = async (value, key) => { try { await navigator.clipboard.writeText(value); setCopied(key); setTimeout(() => setCopied(''), 1200); announce(`${value} copied`) } catch { announce('Clipboard access isn’t available in this browser') } }
  const shuffle = () => {
    const next = [...colors], open = next.map((_, i) => i).filter(i => !locked[i]), values = open.map(i => next[i]); for (let i = values.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [values[i], values[j]] = [values[j], values[i]] } open.forEach((slot, i) => { next[slot] = values[i] }); setColors(next); announce(open.length > 1 ? 'Palette shuffled · locked colors stayed put' : 'Unlock a few colors to shuffle')
  }
  const addFitting = () => { if (colors.length >= 12) { announce('Your palette is full · 12 colors max'); return } const [h, s, l] = rgbToHsl(colors[colors.length - 1]); const step = Math.random() > .5 ? 19 : -19; const newHex = hslToHex((h + step + 360) % 360, Math.max(28, Math.min(75, s + (Math.random() * 18 - 9))), Math.max(32, Math.min(78, l + (Math.random() * 12 - 6)))); setColors(prev => [...prev, newHex]); announce('A kindred shade joined the palette') }
  const addCustom = () => { if (colors.length >= 12) { announce('Your palette is full · 12 colors max'); return } setColors(prev => [...prev, custom.toUpperCase()]); announce(`${custom.toUpperCase()} added to your palette`) }
  const exportCss = () => { const css = `:root {\n${colors.map((c, i) => `  --color-${String(i + 1).padStart(2, '0')}: ${c};`).join('\n')}\n}\n`; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([css], { type: 'text/css' })); a.download = 'palette-thief.css'; a.click(); URL.revokeObjectURL(a.href); announce('CSS variables exported') }
  const randomPalette = () => { const base = Math.random() * 360; setColors(Array.from({ length: 6 }, (_, i) => hslToHex((base + i * (24 + Math.random() * 28)) % 360, 35 + Math.random() * 38, 32 + Math.random() * 40))); setImage(null); setFilename('A happy accident'); announce('A brand new palette, just for you') }

  return <main className="app-shell" onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false) }} onDrop={e => { e.preventDefault(); setDragging(false); extract(e.dataTransfer.files?.[0]) }}>
    <canvas ref={canvasRef} className="sr-only" />
    {dragging && <div className="drop-overlay"><div className="drop-content"><ImagePlus size={34} /><span>Drop it like it’s palette</span></div></div>}
    <header className="topbar"><a className="brand" href="#top" aria-label="Palette Thief home"><IconMark /><span>palette<span className="brand-light">thief</span></span></a><nav className="nav-links"><a href="#studio">The studio</a><a href="#how-it-works">How it works</a></nav><div className="top-actions"><button className="help-btn" onClick={() => setShowHelp(!showHelp)} aria-label="Help"><CircleHelp size={17} /></button><button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}><Menu size={18} /></button><div className="upload-wrap"><button className="top-upload" onClick={() => setMenuOpen(!menuOpen)}><Upload size={15} /> Upload image <ChevronDown size={14} /></button>{menuOpen && <div className="upload-menu"><button onClick={() => { inputRef.current?.click(); setMenuOpen(false) }}><ImagePlus size={16} /> Choose a file</button><button onClick={() => { setSample(samples[Math.floor(Math.random() * samples.length)]); setMenuOpen(false) }}><Shuffle size={16} /> Try a sample image</button><span>JPG, PNG or WebP · max 20 MB</span></div>}</div></div></header>
    {showHelp && <aside className="help-pop"><button aria-label="Close help" className="close-help" onClick={() => setShowHelp(false)}><X size={15} /></button><strong>A tiny field guide</strong><p>Upload any image to find its most distinctive colors. Lock the shades you love, then let the shuffle refresh everything else.</p></aside>}
    <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={e => { extract(e.target.files?.[0]); e.target.value = '' }} />

    <section className="hero" id="top"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> YOUR EYE FOR COLOR, UNLEASHED</div><h1>Color, caught<br />in the <em>wild.</em></h1><p className="hero-sub">A good palette is hiding in every photograph.<br className="desktop-break" /> Let’s find yours.</p><div className="hero-buttons"><button className="lime-btn" onClick={() => inputRef.current?.click()}><Upload size={16} /> Drop an image to begin <ArrowRight size={15} /></button><button className="text-btn" onClick={() => setSample(samples[0])}>or try a sample <span>↗</span></button></div><div className="privacy-note"><span className="privacy-dot" /> Your images stay right here, on your device.</div></div>
      <div className="hero-art" aria-label="Color study: sunlit desert architecture"><div className="art-note"><span>FIELD STUDY N° 018</span><span>34° 03′ N&nbsp; 118° 14′ W</span></div><div className="art-image" style={image ? { backgroundImage: `url(${image})` } : undefined}><div className="sun"/><div className="arch arch-back"/><div className="arch arch-front"/><div className="steps"/><div className="horizon"/><span className="photo-caption">LATE LIGHT, SOMEWHERE WARM</span></div><div className="art-caption"><span>{filename}</span><span className="caption-index">01 <i>—</i> 06</span></div><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/></div>
    </section>

    <section className="studio" id="studio"><div className="studio-head"><div><div className="eyebrow small-eyebrow">THE WORKBENCH</div><h2>Your palette <span>takes shape.</span></h2></div><div className="studio-utility"><button className="quiet-action" onClick={shuffle}><Shuffle size={15} /> Shuffle</button><button className="quiet-action" onClick={addFitting}><Sparkles size={15} /> Find a fitting color</button><button className="export-btn" onClick={exportCss}><ArrowDownToLine size={15} /> Export CSS <span className="export-ext">.css</span></button></div></div>
      <div className="palette-row">{colors.map((color, i) => <article className={`swatch-card ${locked[i] ? 'is-locked' : ''}`} key={`swatch-${i}`} style={{ '--swatch': color, '--delay': `${i * 55}ms` }}><div className="swatch-block" style={{ backgroundColor: color }}><span className="swatch-number">0{i + 1}</span><button className={`lock-btn ${locked[i] ? 'locked' : ''}`} onClick={() => setLocked(prev => ({ ...prev, [i]: !prev[i] }))} aria-label={`${locked[i] ? 'Unlock' : 'Lock'} ${color}`}><LockKeyhole size={14} /></button><button className="swatch-copy" onClick={() => copy(color, `hex-${i}`)} aria-label={`Copy ${color}`}><Copy size={15} /></button>{locked[i] && <span className="lock-status">LOCKED</span>}</div><div className="swatch-meta"><button className="hex-value" onClick={() => copy(color, `hex-${i}`)}>{copied === `hex-${i}` ? <Check size={13} /> : null}{color}</button><button className="rgb-value" onClick={() => copy(hexToRgb(color), `rgb-${i}`)}>{copied === `rgb-${i}` ? 'Copied!' : hexToRgb(color)}</button></div></article>)}</div>
      <div className="palette-footer"><div className="palette-count"><span className="count-dot" /> {colors.length} COLORS <span className="count-divider">/</span> CURATED BY YOU</div><div className="add-color"><span className="add-label">MAKE IT YOURS · 12 MAX</span><label className="color-input-wrap" title="Choose a color"><input type="color" value={custom} onChange={e => setCustom(e.target.value)} /><span className="color-chip" style={{ background: custom }} /></label><button className="add-color-btn" onClick={addCustom}><Plus size={15} /> Add a color</button><button className="surprise-btn" title="Generate a random palette" onClick={randomPalette}><RotateCw size={15} /> Surprise me</button></div></div>
    </section>

    <section className="inspiration" id="how-it-works"><div className="inspiration-top"><div><div className="eyebrow small-eyebrow">A LITTLE INSPIRATION</div><h2>Color happens <span>everywhere.</span></h2></div><button className="see-all" onClick={randomPalette}>Make me something new <ArrowRight size={15} /></button></div><div className="sample-grid">{samples.map((item, idx) => <button className="sample-tile" onClick={() => setSample(item)} key={item.name}><div className={`sample-scene scene-${idx}`}><div className="scene-sun"/><div className="scene-shape scene-shape-a"/><div className="scene-shape scene-shape-b"/><div className="scene-line"/><span>{item.emoji}</span></div><div className="sample-under"><div><strong>{item.name}</strong><span>Six shades · one little moment</span></div><div className="sample-chips">{item.colors.slice(0, 5).map((c, i) => <i key={c} style={{ background: c, zIndex: 5 - i }} />)}</div></div></button>)}</div></section>

    <footer className="footer"><div className="footer-brand"><IconMark /><span>Made for the <em>color curious.</em></span></div><div className="footer-center"><MousePointer2 size={13} /> Every pixel stays on your device</div><span className="footer-note">NO UPLOADS. NO NOISE. JUST COLOR.</span></footer>
    <div className={`toast ${notice ? 'show' : ''}`}><span className="toast-dot" />{notice}</div>
  </main>
}
