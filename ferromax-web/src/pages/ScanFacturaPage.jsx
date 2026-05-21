import { useRef, useState, useCallback, useEffect } from 'react'
import { createWorker } from 'tesseract.js'
import Sidebar from '../components/Sidebar'
import { Camera, ScanLine, RefreshCw, Copy, CheckCheck, FileText } from 'lucide-react'

const CAMPOS = [
  { key: 'numero',    label: 'N° Factura',  regex: /(?:factura|fac|comp\w*)[^\d]*(\d[\d\-\/]+)/i },
  { key: 'fecha',     label: 'Fecha',       regex: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/ },
  { key: 'cuit',      label: 'CUIT',        regex: /(?:cuit|c\.u\.i\.t)[^\d]*(\d{2}-?\d{8}-?\d)/i },
  { key: 'total',     label: 'Total',       regex: /(?:total|importe total)[^\d]*\$?\s*([\d.,]+)/i },
  { key: 'proveedor', label: 'Proveedor',   regex: /(?:raz[oó]n social|proveedor)[:\s]+([^\n]{3,40})/i },
]

function extraerCampos(texto) {
  const resultado = {}
  for (const { key, regex } of CAMPOS) {
    const m = texto.match(regex)
    resultado[key] = m ? m[1].trim() : ''
  }
  return resultado
}

export default function ScanFacturaPage() {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [camaraActiva, setCamaraActiva] = useState(false)
  const [procesando,   setProcesando]   = useState(false)
  const [progreso,     setProgreso]     = useState(0)
  const [textoOCR,     setTextoOCR]     = useState('')
  const [campos,       setCampos]       = useState(null)
  const [imagenURL,    setImagenURL]    = useState(null)
  const [copiado,      setCopiado]      = useState(false)
  const [error,        setError]        = useState('')
  const [debug,        setDebug]        = useState('')

  const iniciarCamara = useCallback(async () => {
    setError('')
    setDebug('Solicitando permisos...')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      setDebug(`Stream OK — ${stream.getVideoTracks().length} track(s)`)
      setCamaraActiva(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setDebug('Video asignado')
        } else {
          setDebug('ERROR: videoRef.current es null después del render')
        }
      }, 50)
    } catch (err) {
      setError(`Error: ${err.name} — ${err.message}`)
      setDebug(`Excepción: ${err.name}`)
    }
  }, [])

  const detenerCamara = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCamaraActiva(false)
    setTextoOCR('')
    setCampos(null)
    setImagenURL(null)
    setProgreso(0)
  }, [])

  const capturarYProcesar = useCallback(async () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const dataURL = canvas.toDataURL('image/png')
    setImagenURL(dataURL)
    setProcesando(true)
    setProgreso(0)
    setTextoOCR('')
    setCampos(null)

    try {
      const worker = await createWorker('spa', 1, {
        logger: m => { if (m.status === 'recognizing text') setProgreso(Math.round(m.progress * 100)) },
      })
      const { data } = await worker.recognize(dataURL)
      await worker.terminate()
      setTextoOCR(data.text)
      setCampos(extraerCampos(data.text))
    } catch {
      setError('Error al procesar la imagen con OCR.')
    } finally {
      setProcesando(false)
    }
  }, [])

  const copiarTexto = () => {
    navigator.clipboard.writeText(textoOCR)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="flex min-h-screen bg-[#0F0F1A]">
      <Sidebar />

      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScanLine className="text-[#FF6B35]" size={24} />
            Escanear Factura
          </h1>
          <p className="text-white/40 text-sm mt-1">Usá la cámara para capturar y extraer datos de una factura</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Panel cámara */}
          <div className="bg-[#1A1A2E] rounded-2xl border border-white/5 p-5 space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2 text-sm">
              <Camera size={16} className="text-[#FF6B35]" /> Cámara
            </h2>

            <div className="relative rounded-xl bg-black aspect-video flex items-center justify-center" style={{overflow:'hidden'}}>
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay muted playsInline style={{display: camaraActiva ? 'block' : 'none'}} />
              {!camaraActiva && (
                <div className="flex flex-col items-center justify-center text-white/20 gap-2 w-full h-full">
                  <Camera size={48} />
                  <p className="text-sm">Cámara inactiva</p>
                </div>
              )}
              {camaraActiva && (
                <div className="absolute inset-4 border-2 border-[#FF6B35]/50 rounded-lg pointer-events-none">
                  <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#FF6B35] rounded-tl" />
                  <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#FF6B35] rounded-tr" />
                  <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#FF6B35] rounded-bl" />
                  <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#FF6B35] rounded-br" />
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {debug && (
              <p className="text-yellow-400 text-xs bg-yellow-500/10 rounded-lg px-3 py-2 font-mono">{debug}</p>
            )}
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3">
              {!camaraActiva ? (
                <button onClick={iniciarCamara}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#FF6B35]/80 text-white font-semibold py-2.5 rounded-xl transition-all text-sm">
                  <Camera size={16} /> Activar cámara
                </button>
              ) : (
                <>
                  <button onClick={capturarYProcesar} disabled={procesando}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#FF6B35]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all text-sm">
                    {procesando
                      ? <><RefreshCw size={16} className="animate-spin" /> Procesando {progreso}%</>
                      : <><ScanLine size={16} /> Capturar y escanear</>}
                  </button>
                  <button onClick={detenerCamara}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 text-sm transition-all">
                    Detener
                  </button>
                </>
              )}
            </div>

            {imagenURL && (
              <div>
                <p className="text-white/30 text-xs mb-2">Imagen capturada</p>
                <img src={imagenURL} alt="Captura" className="rounded-xl w-full border border-white/10" />
              </div>
            )}
          </div>

          {/* Panel resultados */}
          <div className="space-y-4">
            {campos && (
              <div className="bg-[#1A1A2E] rounded-2xl border border-white/5 p-5">
                <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-[#FF6B35]" /> Datos extraídos
                </h2>
                <div className="space-y-3">
                  {CAMPOS.map(({ key, label }) => (
                    <div key={key}>
                      <p className="text-white/30 text-xs mb-1">{label}</p>
                      <input
                        value={campos[key]}
                        onChange={e => setCampos(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder="No detectado"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF6B35]/50 transition-colors placeholder-white/20"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {textoOCR && (
              <div className="bg-[#1A1A2E] rounded-2xl border border-white/5 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-semibold text-sm">Texto reconocido (OCR)</h2>
                  <button onClick={copiarTexto}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-all">
                    {copiado ? <><CheckCheck size={12} className="text-green-400" /> Copiado</> : <><Copy size={12} /> Copiar</>}
                  </button>
                </div>
                <pre className="text-white/50 text-xs font-mono bg-black/30 rounded-xl p-4 max-h-72 overflow-auto whitespace-pre-wrap leading-relaxed">
                  {textoOCR}
                </pre>
              </div>
            )}

            {!campos && !procesando && (
              <div className="bg-[#1A1A2E] rounded-2xl border border-white/5 p-8 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center">
                  <ScanLine size={24} className="text-[#FF6B35]/60" />
                </div>
                <p className="text-white/30 text-sm">Activá la cámara, apuntá a la factura<br/>y presioná <span className="text-white/50 font-medium">Capturar y escanear</span></p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
