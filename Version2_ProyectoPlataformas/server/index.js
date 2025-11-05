import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5174;

app.use(cors());
app.use(express.json());

// servir estáticos para pruebas locales
app.use(express.static(path.join(__dirname, "..")));

const dataDir = path.join(__dirname, "..", "data");
const outFile = path.join(dataDir, "contactos.txt");
if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, {recursive:true});

app.post("/api/contactos", (req,res)=>{
  const {nombre, email, telefono, asunto, mensaje, fecha} = req.body||{};
  if(!nombre || !email || !telefono || !asunto || !mensaje){
    return res.status(400).json({ok:false, error:"Datos incompletos"});
  }
  const line = `${fecha||new Date().toISOString()}	${nombre}	${email}	${telefono}	${asunto}	${mensaje.replace(/\n/g,' ')}`;
  try{
    fs.appendFileSync(outFile, line + "\n", "utf-8");
    return res.json({ok:true});
  }catch(e){
    return res.status(500).json({ok:false, error:"No se pudo escribir archivo"});
  }
});

app.listen(PORT, ()=>{
  console.log("New Era Tech dev server en http://localhost:"+PORT);
});