import { useState, useEffect, useRef } from 'react'
import './App.css'
import { supabase } from './supabaseClient'
import { UtensilsCrossed, Car, Home, Gamepad2, Lightbulb, ShoppingCart, MoreVertical, Pencil, Copy, Trash2, CalendarDays, Tags, FileText, DollarSign, Wallet, Plus } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const CATEGORIAS = {
  Comida:      { color: '#F97316', Icono: UtensilsCrossed },
  Transporte:  { color: '#3B82F6', Icono: Car },
  Hogar:       { color: '#22C55E', Icono: Home },
  Ocio:        { color: '#A855F7', Icono: Gamepad2 },
  Servicios:   { color: '#FACC15', Icono: Lightbulb },
  Compras:     { color: '#EC4899', Icono: ShoppingCart },
}
const fechaDeHoy = () => new Date().toISOString().split('T')[0]

function App() {
  const [idEntrando, setIdEntrando] = useState(null)
  const filasRefs = useRef({})
  const [toastSaliendo, setToastSaliendo] = useState(false)
  const toastHideRef = useRef(null)
  const [idsSaliendo, setIdsSaliendo] = useState([])
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)
  const [fechaEdit, setFechaEdit] = useState("")
  const [categoriaEdit, setCategoriaEdit] = useState("Comida")
  const [montoEdit, setMontoEdit] = useState("")
  const [descripcionEdit, setDescripcionEdit] = useState("")
  const [gastoEditando, setGastoEditando] = useState(null)
  const [gastos, setGastos] = useState([])
  const [fecha, setFecha] = useState(fechaDeHoy)
  const [descripcion, setDescripcion] = useState("")
  const [monto, setMonto] = useState("")
  const [categoria, setCategoria] = useState("Comida")
  const [seleccionados, setSeleccionados] = useState([])
  const total = gastos.reduce((acumulado, gasto) => {
    return acumulado + Number(gasto.monto)
  }, 0)
  const [menuAbierto, setMenuAbierto] = useState(null)

  const gastosPorCategoria = Object.keys(CATEGORIAS)
  .map((nombre) => {
    const deEstaCategoria = gastos.filter((gasto) => gasto.categoria === nombre)
    const montoTotal = deEstaCategoria.reduce((acc, gasto) => acc + Number(gasto.monto), 0)
    return {
      categoria: nombre,
      monto: montoTotal,
      color: CATEGORIAS[nombre].color,
      Icono: CATEGORIAS[nombre].Icono,
    }
  })
  .filter((item) => item.monto > 0)

  const iniciarSalidaFila = (id) => {
    const el = filasRefs.current[id]
    if (!el) return

    el.style.height = `${el.scrollHeight}px`
    el.offsetHeight

    requestAnimationFrame(() => {
      el.style.height = '0px'
      el.style.marginTop = '0px'
      el.style.marginBottom = '0px'
    })
  }

  const cerrarToast = () => {
    clearTimeout(toastTimeoutRef.current)
    clearTimeout(toastHideRef.current)
    setToastSaliendo(true)
    toastHideRef.current = setTimeout(() => {
      setToast(null)
      setToastSaliendo(false)
    }, 250)
  }

  const deshacerEliminar = async () => {
    if (!toast) return

    const copias = toast.gastosEliminados.map((gasto) => ({
      monto: gasto.monto,
      categoria: gasto.categoria,
      fecha: gasto.fecha,
      descripcion: gasto.descripcion,
    }))

    const { data, error } = await supabase.from('gastos').insert(copias).select()
    setGastos((prev) => [...prev, ...data])

    cerrarToast()
  }

  const mostrarToast = (mensaje, gastosEliminados) => {
    clearTimeout(toastTimeoutRef.current)
    clearTimeout(toastHideRef.current)
    setToastSaliendo(false)
    setToast({ mensaje, gastosEliminados })
    toastTimeoutRef.current = setTimeout(cerrarToast, 3000)
  }

  const confirmarBorrado = () => {
    if (confirmarEliminar.tipo === 'individual') {
      const gasto = confirmarEliminar.gasto
      setConfirmarEliminar(null)
      iniciarSalidaFila(gasto.id)
      setIdsSaliendo((prev) => [...prev, gasto.id])

      setTimeout(async () => {
        await eliminarGasto(gasto.id)
        setIdsSaliendo((prev) => prev.filter((id) => id !== gasto.id))
        mostrarToast('Gasto eliminado correctamente', [gasto])
      }, 300)
    } else {
      const idsABorrar = seleccionados
      const gastosABorrar = gastos.filter((gasto) => idsABorrar.includes(gasto.id))
      setConfirmarEliminar(null)
      idsABorrar.forEach((id) => iniciarSalidaFila(id))
      setIdsSaliendo((prev) => [...prev, ...idsABorrar])

      setTimeout(async () => {
        await borrarSeleccionados()
        setIdsSaliendo((prev) => prev.filter((id) => !idsABorrar.includes(id)))
        mostrarToast(
          `${gastosABorrar.length} gasto${gastosABorrar.length > 1 ? 's' : ''} eliminado${gastosABorrar.length > 1 ? 's' : ''} correctamente`,
          gastosABorrar
        )
      }, 300)
    }
  }

  const guardarEdicion = async () => {
    const { error } = await supabase
      .from('gastos')
      .update({
        fecha: fechaEdit,
        categoria: categoriaEdit,
        descripcion: descripcionEdit,
        monto: montoEdit,
      })
      .eq('id', gastoEditando.id)

    setGastos(gastos.map((gasto) =>
      gasto.id === gastoEditando.id
        ? { ...gasto, fecha: fechaEdit, categoria: categoriaEdit, descripcion: descripcionEdit, monto: montoEdit }
        : gasto
    ))
    setGastoEditando(null)
  }

  const agregarGasto = async () => {
  if (monto === "" || descripcion === "" || fecha === "") {
    return
  }
  const nuevoGasto = {
    monto: monto,
    categoria: categoria,
    fecha: fecha,
    descripcion: descripcion,
  }
  const { data, error } = await supabase.from('gastos').insert(nuevoGasto).select()
  const gastoInsertado = data[0]

  setGastos([...gastos, gastoInsertado])
  setIdEntrando(gastoInsertado.id)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setIdEntrando(null)
    })
  })

  setMonto("")
  setFecha(fechaDeHoy())
  setDescripcion("")
  setCategoria("Comida")
}

  useEffect(() => {
    const traerGastos = async () => {
      const { data, error } = await supabase.from('gastos').select('*')
      setGastos(data)
    }
    traerGastos()
  }, [])

  const borrarSeleccionados = async () => {
    const { error } = await supabase.from('gastos').delete().in('id', seleccionados)
    setGastos(gastos.filter((gasto) => !seleccionados.includes(gasto.id)))
    setSeleccionados([])
  }

  const eliminarGasto = async (id) => {
    const { error } = await supabase.from('gastos').delete().eq('id', id)
    setGastos(gastos.filter((gasto) => gasto.id !== id))
    setMenuAbierto(null)
  }

  const duplicarGasto = async (gasto) => {
    const copia = {
      monto: gasto.monto,
      categoria: gasto.categoria,
      fecha: gasto.fecha,
      descripcion: gasto.descripcion,
    }
    const { data, error } = await supabase.from('gastos').insert(copia).select()
    setGastos([...gastos, data[0]])
    setMenuAbierto(null)
  }

  useEffect(() => {
    if (menuAbierto === null) return
    const cerrarMenu = () => setMenuAbierto(null)
    document.addEventListener('click', cerrarMenu)
    return () => document.removeEventListener('click', cerrarMenu)
  }, [menuAbierto])

  useEffect(() => {
    if (gastoEditando) {
      setFechaEdit(gastoEditando.fecha)
      setCategoriaEdit(gastoEditando.categoria)
      setDescripcionEdit(gastoEditando.descripcion)
      setMontoEdit(gastoEditando.monto)
    }
  }, [gastoEditando])

  return (
    <>
      <div className='seccion'>
        <h2 className='titulo-seccion'><Wallet size={18} /> Nuevo gasto</h2>
        <form className='barra'>
          <div className='campo'>
            <label className='campo-label'>Fecha</label>
            <div className='campo-input'>
              <CalendarDays size={16} className='campo-icono' />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>

          <div className='campo'>
            <label className='campo-label'>Categoría</label>
            <div className='campo-input'>
              {(() => {
                const IconoCat = CATEGORIAS[categoria].Icono
                return <IconoCat size={16} className='campo-icono' style={{ color: CATEGORIAS[categoria].color }} />
              })()}
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {Object.keys(CATEGORIAS).map((nombre) => (
                  <option key={nombre}>{nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className='campo campo-crece'>
            <label className='campo-label'>Descripción</label>
            <div className='campo-input'>
              <FileText size={16} className='campo-icono' />
              <input
                type="text"
                placeholder="Descripción del gasto"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
          </div>

          <div className='campo'>
            <label className='campo-label'>Monto</label>
            <div className='campo-input'>
              <DollarSign size={16} className='campo-icono' />
              <input
                type="number"
                placeholder="Ingrese el monto"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
          </div>
          <button type="button" className='btn-agregar' onClick={agregarGasto}>
            <Plus size={16} /> Agregar gasto
          </button>
        </form>
      </div>

      <div className='seccion'>
        <div className='tarjeta-resumen'>
          <div className='tarjeta-total'>
            <div className='tarjeta-total-icono'>
              <Wallet size={22} />
            </div>
            <div className='tarjeta-total-info'>
              <span className='tarjeta-total-label'>Total gastado</span>
              <span className='tarjeta-total-monto'>-${total}</span>
              <span className='tarjeta-total-periodo'>Este mes</span>
              <span className='tarjeta-total-cantidad'>
                <FileText size={14} /> {gastos.length} gasto{gastos.length !== 1 ? 's' : ''} registrado{gastos.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {gastosPorCategoria.length > 0 && (
            <>
              <div className='dona-categorias'>
                <ResponsiveContainer width={"100%"} height={"100%"}>
                  <PieChart>
                    <Pie
                      data={gastosPorCategoria}
                      dataKey='monto'
                      nameKey='categoria'
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={2}
                      stroke='none'
                    >
                      {gastosPorCategoria.map((item) => (
                        <Cell key={item.categoria} fill={item.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className='dona-centro'>
                  <span className='dona-centro-monto'>-${total}</span>
                  <span className='dona-centro-label'>Total</span>
                </div>
              </div>

              <div className='lista-categorias'>
                {gastosPorCategoria.map((item) => {
                  const Icono = item.Icono
                  const porcentaje = Math.round((item.monto / total) * 100)
                  return (
                    <div key={item.categoria} className='lista-categorias-item'>
                      <span className='lista-categorias-punto' style={{ background: item.color }} />
                      <Icono size={14} style={{ color: item.color }} />
                      <span className='lista-categorias-nombre'>{item.categoria}</span>
                      <span className='lista-categorias-monto'>-${item.monto}</span>
                      <span className='lista-categorias-porcentaje'>{porcentaje}%</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className='seccion'>
        <h2>Gastos registrados</h2>
        <div className={`tabla-gastos ${seleccionados.length > 0 ? 'hay-seleccion' : ''}`}>

          <div className='encabezado'>
            <input type='checkbox' disabled style={{visibility: 'hidden'}} />
            <p><CalendarDays size={14} /> Fecha</p>
            <p><Tags size={14} /> Categoría</p>
            <p><FileText size={14} /> Descripción</p>
            <p className='col-monto'><DollarSign size={14} /> Monto</p>
            <p></p>
          </div>
          {gastos.map((gasto) => (
            <div
              key={gasto.id}
              ref={(el) => { filasRefs.current[gasto.id] = el }}
              className={`fila-wrapper ${idsSaliendo.includes(gasto.id) ? 'saliendo' : ''} ${gasto.id === idEntrando ? 'entrando' : ''}`}
            >
              <div
                className='gasto'
                onMouseLeave={() => setMenuAbierto(null)}
                onDoubleClick={() => setGastoEditando(gasto)}
              >
                <div className='celda-check'>
                  <input
                    type="checkbox"
                    checked={seleccionados.includes(gasto.id)}
                    onChange={() => {
                      if (seleccionados.includes(gasto.id)) {
                        setSeleccionados(seleccionados.filter((id) => id !== gasto.id))
                      } else {
                        setSeleccionados([...seleccionados, gasto.id])
                      }
                    }}
                  />
                </div>
                <p>{gasto.fecha.split("-")[2]}/{gasto.fecha.split("-")[1]}/{gasto.fecha.split("-")[0]}</p>
                <div className='celda-categoria'>
                  {(() => {
                    const cat = CATEGORIAS[gasto.categoria]
                    if (!cat) return <span className='badge badge-otros'>{gasto.categoria}</span>
                    const Icono = cat.Icono
                    return (
                      <span
                        className='badge'
                        style={{ color: cat.color, background: `${cat.color}22`, borderColor: `${cat.color}55` }}
                      >
                        <Icono size={14} />
                        {gasto.categoria}
                      </span>
                    )
                  })()}
                </div>
                <p>{gasto.descripcion}</p>
                <p className='monto'>-${gasto.monto}</p>
                <div className='celda-acciones'>
                  <button
                    type='button'
                    className='btn-menu'
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuAbierto(menuAbierto === gasto.id ? null : gasto.id)
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuAbierto === gasto.id && (
                    <div className='menu-contextual'>
                      <button
                        type='button'
                        className='menu-item'
                        onClick={() => { setGastoEditando(gasto); setMenuAbierto(null) }}
                      >
                        <Pencil size={15} /> Editar
                      </button>
                      <button
                        type='button'
                        className='menu-item'
                        onClick={() => duplicarGasto(gasto)}
                      >
                        <Copy size={15} /> Duplicar
                      </button>
                      <button
                        type='button'
                        className='menu-item menu-item-peligro'
                        onClick={() => { setConfirmarEliminar({ tipo: 'individual', gasto }); setMenuAbierto(null) }}
                      >
                        <Trash2 size={15} /> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {seleccionados.length > 0 && (
            <div className='acciones-tabla-abajo'>
              <button type='button' className='btn-eliminar-seleccionados' onClick={() => setConfirmarEliminar({ tipo: 'multiple' })}>
                <Trash2 size={15} /> Eliminar seleccionados
              </button>
            </div>
          )}
        </div>
      </div>

      {gastoEditando && (
        <div className='modal-overlay' onClick={() => setGastoEditando(null)}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <h2>Editar gasto</h2>
            <div className='modal-campo'>
              <label>Fecha</label>
              <input
                type="date"
                value={fechaEdit}
                onChange={(e) => setFechaEdit(e.target.value)}
              />
            </div>
            <div className='modal-campo'>
              <label>Categoria</label>
              <select value={categoriaEdit} onChange={(e) => setCategoriaEdit(e.target.value)}>
                {Object.keys(CATEGORIAS).map((nombre) => (
                  <option key={nombre}>{nombre}</option>
                ))}
              </select>
            </div>
            <div className='modal-campo'>
              <label>Descripción</label>
              <input
                type="text"
                value={descripcionEdit}
                onChange={(e) => setDescripcionEdit(e.target.value)}
              />
            </div>
            <div className='modal-campo'>
              <label>Monto</label>
              <input
                type="number"
                value={montoEdit}
                onChange={(e) => setMontoEdit(e.target.value)}
              />
            </div>
            <div className='modal-acciones'>
              <button type='button' className='btn-cancelar' onClick={() => setGastoEditando(null)}>
                Cancelar
              </button>
              <button type='button' className='btn-guardar' onClick={guardarEdicion}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmarEliminar && (
        <div className='modal-overlay' onClick={() => setConfirmarEliminar(null)}>
          <div className='modal modal-confirmacion' onClick={(e) => e.stopPropagation()}>
            <h2>
              {confirmarEliminar.tipo === 'individual' ? '¿Eliminar este gasto?' : '¿Eliminar los gastos seleccionados?'}
            </h2>
            <p className='modal-confirmacion-texto'>
              {confirmarEliminar.tipo === 'individual'
                ? `¿Seguro que querés eliminar "${confirmarEliminar.gasto.descripcion}"? Esta acción no puede deshacerse.`
                : `¿Seguro que querés eliminar ${seleccionados.length} gasto${seleccionados.length > 1 ? 's' : ''}? Esta acción no puede deshacerse.`}
            </p>
            <div className='modal-acciones'>
              <button type='button' className='btn-cancelar' onClick={() => setConfirmarEliminar(null)}>
                Cancelar
              </button>
              <button type='button' className='btn-eliminar-confirmar' onClick={confirmarBorrado}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toastSaliendo ? 'toast-saliendo' : ''}`}>
          <span>✔ {toast.mensaje}</span>
          <button type='button' className='toast-deshacer' onClick={deshacerEliminar}>
            Deshacer
          </button>
        </div>
      )}
    </>
  )
}
export default App