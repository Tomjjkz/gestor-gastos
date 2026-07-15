import { useState } from 'react'
import './App.css'

function App() {
  const agregarGasto = () => 
    {
      const nuevoGasto =
      {
        monto: monto,
        categoria: categoria,
        fecha: fecha,
        descripcion: descripcion,
      }
      setGastos([...gastos, nuevoGasto])
      console.log(nuevoGasto)
    }
  const [gastos, setGastos] = useState([])
  const [fecha, setFecha] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [monto, setMonto] = useState("")
  const [categoria, setCategoria] = useState("Comida")

  return (
    <>
      <form>
        <input 
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option>Comida</option>
          <option>Transporte</option>
          <option>Entretenimiento</option>
          <option>Servicios</option>
          <option>Salud</option>
          <option>Otros</option>
        </select>
        <input 
          type="text" 
          placeholder="Descripcion del gasto"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <input 
          type="number" 
          placeholder="Ingrese el monto"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
        />
        <button type="button" onClick={agregarGasto}>Agregar gasto</button>
      </form> 
      {gastos.map((gasto, index) => (
        <div key={index}>
          <p>{gasto.fecha}</p>
          <p>{gasto.categoria}</p>
          <p>{gasto.descripcion}</p>
          <p>{gasto.monto}</p>
        </div>
        ))}
      <div className="ticks"></div>
      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App

  